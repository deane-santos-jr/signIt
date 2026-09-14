"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { documents, fields, signers } from "@/db/schema";
import {
  allClientsSigned,
  loadDocument,
  loadSignerByToken,
  recordAudit,
} from "@/lib/documents";
import { stampSignature } from "@/lib/pdf";
import { requestOrigin } from "@/lib/request";
import { fetchPdf, storePdf } from "@/lib/storage";

export async function submitSignature(
  token: string,
  signaturePng: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!signaturePng.startsWith("data:image/png;base64,")) {
    return { ok: false, error: "Draw your signature first." };
  }
  const found = await loadSignerByToken(token);
  if (!found) return { ok: false, error: "This signing link is not valid." };
  const { signer, bundle } = found;
  if (bundle.document.status === "draft") {
    return { ok: false, error: "This document has not been sent yet." };
  }
  if (signer.signedAt) return { ok: false, error: "You have already signed." };

  const myFields = bundle.fields.filter((f) => f.signerId === signer.id);
  if (myFields.length === 0) {
    return { ok: false, error: "No signature box is assigned to you." };
  }

  const signedAt = new Date();
  const origin = await requestOrigin();
  let pdf = await fetchPdf(bundle.document.workingUrl);
  for (const field of myFields) {
    pdf = await stampSignature(pdf, {
      field,
      signaturePngDataUrl: signaturePng,
    });
  }
  const workingUrl = await storePdf(
    `documents/${bundle.document.id}/working.pdf`,
    pdf,
  );

  await db
    .update(fields)
    .set({ signedAt })
    .where(inArray(fields.id, myFields.map((f) => f.id)));
  await db
    .update(signers)
    .set({ signedAt, signedIp: origin.ip, signedUserAgent: origin.userAgent })
    .where(eq(signers.id, signer.id));
  await db
    .update(documents)
    .set({ workingUrl })
    .where(eq(documents.id, bundle.document.id));
  await recordAudit({
    documentId: bundle.document.id,
    actor: signer.name,
    action: "signer.signed",
    ip: origin.ip,
    userAgent: origin.userAgent,
  });

  const updated = await loadDocument(bundle.document.id);
  if (updated && allClientsSigned(updated)) {
    await db
      .update(documents)
      .set({ status: "awaiting_countersign" })
      .where(eq(documents.id, bundle.document.id));
  }
  revalidatePath(`/sign/${token}`);
  revalidatePath(`/admin/documents/${bundle.document.id}`);
  return { ok: true };
}
