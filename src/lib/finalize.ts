import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { sendSignedCopy } from "./email";
import { env } from "./env";
import { loadDocument, recordAudit, type DocumentBundle } from "./documents";
import { appendAuditPage, sha256Hex, type AuditLine } from "./pdf";
import { signedPdfFileName } from "./pdfFiles";
import { fetchPdf, storePdf } from "./storage";

type AdminSignature = {
  name: string;
  ip: string | null;
  userAgent: string | null;
  signedAt: Date;
};

const COUNTERSIGNER_ROLE = "Countersigned";

export function certificateLines(
  bundle: DocumentBundle,
  admin: AdminSignature,
): AuditLine[] {
  const signerLines = bundle.signers.map((s) => ({
    name: s.name,
    role: `Signer for ${bundle.document.clientName}`,
    signedAt: s.signedAt!,
    ip: s.signedIp,
    userAgent: s.signedUserAgent,
  }));
  return [...signerLines, { ...admin, role: COUNTERSIGNER_ROLE }];
}

export async function finalizeDocument(
  documentId: string,
  admin: AdminSignature,
): Promise<void> {
  const bundle = await loadDocument(documentId);
  if (!bundle) throw new Error("Document not found");

  const lines = certificateLines(bundle, admin);
  const finalBytes = await appendAuditPage(
    await fetchPdf(bundle.document.workingUrl),
    {
      documentTitle: bundle.document.title,
      documentId,
      originalSha256: bundle.document.originalSha256,
      lines,
    },
  );
  const finalUrl = await storePdf(`documents/${documentId}/final.pdf`, finalBytes);
  const finalSha256 = await sha256Hex(finalBytes);

  await db
    .update(documents)
    .set({ finalUrl, finalSha256, status: "completed", completedAt: new Date() })
    .where(eq(documents.id, documentId));
  await recordAudit({
    documentId,
    actor: "system",
    action: "document.completed",
    detail: `sha256 ${finalSha256}`,
  });

  const recipients = [
    env.adminEmail(),
    ...bundle.signers.map((s) => s.email).filter((e): e is string => !!e),
  ];
  await sendSignedCopy({
    to: recipients,
    documentTitle: bundle.document.title,
    clientName: bundle.document.clientName,
    pdf: finalBytes,
    fileName: signedPdfFileName(bundle.document.title),
  });
}
