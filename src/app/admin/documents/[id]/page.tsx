import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { env } from "@/lib/env";
import { listAudit, loadDocument } from "@/lib/documents";
import { loadAdminSignature } from "@/lib/adminSignature";
import { FieldPlacer } from "./FieldPlacer";
import { SendButton } from "./SendButton";
import { CountersignButton } from "./CountersignButton";
import { CopyLink } from "./CopyLink";
import { DeleteButton } from "./DeleteButton";

export const dynamic = "force-dynamic";

const when = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export default async function DocumentPage({
  params,
}: PageProps<"/admin/documents/[id]">) {
  const { id } = await params;
  const bundle = await loadDocument(id);
  if (!bundle) notFound();
  const { document, signers, fields } = bundle;
  const [audit, adminSignature] = await Promise.all([listAudit(id), loadAdminSignature()]);
  const appUrl = env.appUrl();

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Link href="/admin" className="text-xs text-ink-muted hover:text-ink">
          All documents
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl">{document.title}</h1>
            <p className="mt-2 text-sm text-ink-muted">
              {document.clientName} · {document.pageCount} pages · created {when.format(document.createdAt)}
            </p>
          </div>
          <StatusBadge status={document.status} />
        </div>
      </div>

      {document.status === "awaiting_countersign" && (
        <section className="card reveal border-info-ink/20 bg-info p-6">
          <p className="font-serif text-2xl text-info-ink">Everyone has signed. Your turn.</p>
          <p className="mt-1 text-sm text-info-ink/80">
            Read the signed document below, then apply your saved signature. That finalises it and emails the copies.
          </p>
          <div className="mt-4">
            <CountersignButton documentId={id} hasSavedSignature={!!adminSignature?.signaturePng} />
          </div>
        </section>
      )}

      {document.status === "completed" && (
        <section className="card reveal border-ok-ink/20 bg-ok p-6">
          <p className="font-serif text-2xl text-ok-ink">
            Completed {document.completedAt && when.format(document.completedAt)}
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-ok-ink/70">SHA-256 {document.finalSha256}</p>
          <a href={`/api/documents/${id}/pdf?final=1`} className="btn btn-primary mt-4">
            Download signed PDF
          </a>
        </section>
      )}

      <section className="card reveal" style={{ ["--i" as string]: 1 }}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <p className="label">Signers</p>
          {document.status === "draft" && (
            <p className="text-xs text-ink-muted">Links appear once the document is marked sent</p>
          )}
        </div>
        <ul className="divide-y divide-line">
          {signers.map((signer) => (
            <li key={signer.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
              <div>
                <p className="font-medium">{signer.name}</p>
                <p className="text-xs text-ink-muted">{signer.email ?? "No email, send the link yourself"}</p>
              </div>
              {signer.signedAt ? (
                <span className="tag bg-ok text-ok-ink">Signed {when.format(signer.signedAt)}</span>
              ) : document.status !== "draft" ? (
                <CopyLink url={`${appUrl}/sign/${signer.token}`} />
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {document.status === "draft" && (
        <section className="reveal flex flex-col gap-4" style={{ ["--i" as string]: 2 }}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="serif text-2xl">Place signature boxes</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Choose who the box is for, click where it goes, drag to adjust. One box each, including yours.
              </p>
            </div>
            <SendButton documentId={id} />
          </div>
          <FieldPlacer
            documentId={id}
            pdfUrl={`/api/documents/${id}/pdf`}
            signers={signers.map((s) => ({ id: s.id, name: s.name }))}
            initialFields={fields.map((f) => ({
              owner: f.owner,
              signerId: f.signerId,
              pageIndex: f.pageIndex,
              x: f.x,
              y: f.y,
              width: f.width,
              height: f.height,
            }))}
          />
        </section>
      )}

      {document.status !== "draft" && (
        <section className="reveal" style={{ ["--i" as string]: 2 }}>
          <p className="label mb-3">Document</p>
          <iframe
            src={`/api/documents/${id}/pdf${document.status === "completed" ? "?final=1" : ""}`}
            className="h-[80vh] w-full rounded-lg border border-line bg-white"
            title="Document preview"
          />
        </section>
      )}

      <section className="reveal" style={{ ["--i" as string]: 3 }}>
        <p className="label mb-3">Activity</p>
        <ol className="border-l border-line pl-5 text-sm">
          {audit.map((event) => (
            <li key={event.id} className="relative py-1.5">
              <span className="absolute -left-[23px] top-3 h-1.5 w-1.5 rounded-full bg-line-strong" />
              <span className="text-ink-muted">{when.format(event.at)}</span>
              <span className="mx-2 text-ink-faint">·</span>
              <span className="font-medium">{event.actor}</span>
              <span className="mx-2 text-ink-faint">·</span>
              <span>{event.action.replace(".", " ")}</span>
              {event.detail && <span className="text-ink-muted"> · {event.detail}</span>}
              {event.ip && <span className="text-ink-faint"> · {event.ip}</span>}
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-line pt-6">
        <DeleteButton documentId={id} title={document.title} />
      </section>
    </div>
  );
}
