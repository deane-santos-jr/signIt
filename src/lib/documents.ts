import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  auditEvents,
  documents,
  fields,
  signers,
  type Document,
  type Field,
  type Signer,
} from "@/db/schema";
import { newId } from "./ids";

export type DocumentBundle = {
  document: Document;
  signers: Signer[];
  fields: Field[];
};

export async function listDocuments(): Promise<Document[]> {
  return db.select().from(documents).orderBy(desc(documents.createdAt));
}

export async function loadDocument(id: string): Promise<DocumentBundle | null> {
  const [document] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id));
  if (!document) return null;
  const [signerRows, fieldRows] = await Promise.all([
    db
      .select()
      .from(signers)
      .where(eq(signers.documentId, id))
      .orderBy(asc(signers.createdAt)),
    db.select().from(fields).where(eq(fields.documentId, id)),
  ]);
  return { document, signers: signerRows, fields: fieldRows };
}

export async function loadSignerByToken(
  token: string,
): Promise<{ signer: Signer; bundle: DocumentBundle } | null> {
  const [signer] = await db
    .select()
    .from(signers)
    .where(eq(signers.token, token));
  if (!signer) return null;
  const bundle = await loadDocument(signer.documentId);
  if (!bundle) return null;
  return { signer, bundle };
}

export async function recordAudit(event: {
  documentId: string;
  actor: string;
  action: string;
  ip?: string | null;
  userAgent?: string | null;
  detail?: string;
}): Promise<void> {
  await db.insert(auditEvents).values({ id: newId(), ...event });
}

export async function listAudit(documentId: string) {
  return db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.documentId, documentId))
    .orderBy(asc(auditEvents.at));
}

export function unsignedSignerFields(bundle: DocumentBundle): Field[] {
  return bundle.fields.filter((f) => f.owner === "signer" && !f.signedAt);
}

export function adminField(bundle: DocumentBundle): Field | undefined {
  return bundle.fields.find((f) => f.owner === "admin");
}

export function allClientsSigned(bundle: DocumentBundle): boolean {
  return (
    bundle.signers.length > 0 &&
    bundle.signers.every((s) => s.signedAt !== null) &&
    unsignedSignerFields(bundle).length === 0
  );
}

export async function pendingAdminFields(documentId: string): Promise<Field[]> {
  return db
    .select()
    .from(fields)
    .where(
      and(
        eq(fields.documentId, documentId),
        eq(fields.owner, "admin"),
        isNull(fields.signedAt),
      ),
    );
}
