"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { adminSettings, documents, fields, signers } from "@/db/schema";
import {
  adminField,
  allClientsSigned,
  loadDocument,
  recordAudit,
} from "@/lib/documents";
import { newId, newToken } from "@/lib/ids";
import { pageCountOf, sha256Hex, stampSignature } from "@/lib/pdf";
import { requestOrigin } from "@/lib/request";
import { requireAdmin } from "@/lib/session";
import { deletePdfs, fetchPdf, storePdf } from "@/lib/storage";
import { finalizeDocument } from "@/lib/finalize";
import { ADMIN_SETTINGS_ID, loadAdminSignature } from "@/lib/adminSignature";

const signerInput = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().optional().or(z.literal("")),
});

const createInput = z.object({
  title: z.string().trim().min(1),
  clientName: z.string().trim().min(1),
  signers: z.array(signerInput).min(1),
});

export async function createDocument(formData: FormData): Promise<void> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.type !== "application/pdf") {
    throw new Error("Upload a PDF file");
  }
  const parsed = createInput.parse({
    title: formData.get("title"),
    clientName: formData.get("clientName"),
    signers: JSON.parse(String(formData.get("signers") ?? "[]")),
  });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const id = newId();
  const originalUrl = await storePdf(`documents/${id}/original.pdf`, bytes);

  await db.insert(documents).values({
    id,
    title: parsed.title,
    clientName: parsed.clientName,
    originalUrl,
    originalSha256: await sha256Hex(bytes),
    workingUrl: originalUrl,
    pageCount: await pageCountOf(bytes),
  });
  await db.insert(signers).values(
    parsed.signers.map((s) => ({
      id: newId(),
      documentId: id,
      name: s.name,
      email: s.email || null,
      token: newToken(),
    })),
  );
  await recordAudit({
    documentId: id,
    actor: "admin",
    action: "document.created",
    detail: file.name,
  });
  redirect(`/admin/documents/${id}`);
}

const fieldInput = z.object({
  owner: z.enum(["signer", "admin"]),
  signerId: z.string().nullable(),
  pageIndex: z.number().int().min(0),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});

export async function saveFields(
  documentId: string,
  incoming: unknown,
): Promise<void> {
  await requireAdmin();
  const bundle = await loadDocument(documentId);
  if (!bundle) throw new Error("Document not found");
  if (bundle.document.status !== "draft") {
    throw new Error("Fields are locked once the document is sent");
  }
  const parsed = z.array(fieldInput).parse(incoming);

  await db.delete(fields).where(eq(fields.documentId, documentId));
  if (parsed.length > 0) {
    await db.insert(fields).values(
      parsed.map((f) => ({
        id: newId(),
        documentId,
        owner: f.owner,
        signerId: f.owner === "signer" ? f.signerId : null,
        pageIndex: f.pageIndex,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
      })),
    );
  }
  revalidatePath(`/admin/documents/${documentId}`);
}

export async function markSent(documentId: string): Promise<void> {
  await requireAdmin();
  const bundle = await loadDocument(documentId);
  if (!bundle) throw new Error("Document not found");
  const missing = bundle.signers.filter(
    (s) => !bundle.fields.some((f) => f.signerId === s.id),
  );
  if (missing.length > 0) {
    throw new Error(`Place a signature box for: ${missing.map((s) => s.name).join(", ")}`);
  }
  if (!adminField(bundle)) throw new Error("Place your own signature box");

  await db
    .update(documents)
    .set({ status: "sent" })
    .where(eq(documents.id, documentId));
  await recordAudit({ documentId, actor: "admin", action: "document.sent" });
  revalidatePath(`/admin/documents/${documentId}`);
}

export async function saveAdminSignature(formData: FormData): Promise<void> {
  await requireAdmin();
  const png = String(formData.get("signaturePng") ?? "");
  const name = String(formData.get("signatureName") ?? "").trim();
  if (!png.startsWith("data:image/png;base64,")) throw new Error("Draw a signature");
  if (!name) throw new Error("Enter the name to print under your signature");

  await db
    .insert(adminSettings)
    .values({ id: ADMIN_SETTINGS_ID, signaturePng: png, signatureName: name })
    .onConflictDoUpdate({
      target: adminSettings.id,
      set: { signaturePng: png, signatureName: name, updatedAt: new Date() },
    });
  revalidatePath("/admin/settings");
}

export async function countersign(documentId: string): Promise<void> {
  await requireAdmin();
  const bundle = await loadDocument(documentId);
  if (!bundle) throw new Error("Document not found");
  if (!allClientsSigned(bundle)) throw new Error("Clients have not all signed yet");
  if (bundle.document.adminSignedAt) throw new Error("Already countersigned");

  const saved = await loadAdminSignature();
  if (!saved?.signaturePng || !saved.signatureName) {
    throw new Error("Save your signature in Settings first");
  }
  const field = adminField(bundle);
  if (!field) throw new Error("No admin signature box on this document");

  const signedAt = new Date();
  const origin = await requestOrigin();
  const stamped = await stampSignature(await fetchPdf(bundle.document.workingUrl), {
    field,
    signaturePngDataUrl: saved.signaturePng,
  });
  const workingUrl = await storePdf(`documents/${documentId}/working.pdf`, stamped);

  await db
    .update(fields)
    .set({ signedAt })
    .where(eq(fields.id, field.id));
  await db
    .update(documents)
    .set({ workingUrl, adminSignedAt: signedAt })
    .where(eq(documents.id, documentId));
  await recordAudit({
    documentId,
    actor: "admin",
    action: "document.countersigned",
    ip: origin.ip,
    userAgent: origin.userAgent,
  });

  await finalizeDocument(documentId, { name: saved.signatureName, ...origin, signedAt });
  revalidatePath(`/admin/documents/${documentId}`);
}

export async function deleteDocument(documentId: string): Promise<void> {
  await requireAdmin();
  const bundle = await loadDocument(documentId);
  if (!bundle) throw new Error("Document not found");
  await deletePdfs(
    [bundle.document.originalUrl, bundle.document.workingUrl, bundle.document.finalUrl].filter(
      (u): u is string => !!u,
    ),
  );
  await db.delete(documents).where(eq(documents.id, documentId));
  redirect("/admin");
}
