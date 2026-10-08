import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const documentStatus = pgEnum("document_status", [
  "draft",
  "sent",
  "awaiting_countersign",
  "completed",
]);

export const fieldOwner = pgEnum("field_owner", ["signer", "admin"]);

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  clientName: text("client_name").notNull(),
  status: documentStatus("status").notNull().default("draft"),
  originalUrl: text("original_url").notNull(),
  originalSha256: text("original_sha256").notNull(),
  workingUrl: text("working_url").notNull(),
  finalUrl: text("final_url"),
  finalSha256: text("final_sha256"),
  pageCount: integer("page_count").notNull(),
  adminSignedAt: timestamp("admin_signed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const signers = pgTable("signers", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  token: text("token").notNull().unique(),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  signedIp: text("signed_ip"),
  signedUserAgent: text("signed_user_agent"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [index("signers_document_position_idx").on(t.documentId, t.position)]);

export const fields = pgTable("fields", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  owner: fieldOwner("owner").notNull(),
  signerId: text("signer_id").references(() => signers.id, {
    onDelete: "cascade",
  }),
  pageIndex: integer("page_index").notNull(),
  x: real("x").notNull(),
  y: real("y").notNull(),
  width: real("width").notNull(),
  height: real("height").notNull(),
  signedAt: timestamp("signed_at", { withTimezone: true }),
}, (t) => [index("fields_document_idx").on(t.documentId)]);

export const auditEvents = pgTable("audit_events", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  detail: text("detail"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("audit_events_document_at_idx").on(t.documentId, t.at)]);

export const loginTokens = pgTable("login_tokens", {
  token: text("token").primaryKey(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").notNull().default(false),
});

export const adminSettings = pgTable("admin_settings", {
  id: text("id").primaryKey(),
  signaturePng: text("signature_png"),
  signatureName: text("signature_name"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Document = typeof documents.$inferSelect;
export type Signer = typeof signers.$inferSelect;
export type Field = typeof fields.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
