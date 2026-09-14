import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { env } from "@/lib/env";
import { listAudit, loadDocument } from "@/lib/documents";
import { loadAdminSignature } from "@/lib/adminSignature";
import { FieldPlacer } from "./FieldPlacer";
import { SendButton } from "./SendButton";
import { CountersignButton } from "./CountersignButton";
import { CopyLink } from "./CopyLink";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: PageProps<"/admin/documents/[id]">) {
  const { id } = await params;
  const bundle = await loadDocument(id);
  if (!bundle) notFound();
  const { document, signers, fields } = bundle;
  const [audit, adminSignature] = await Promise.all([
    listAudit(id),
    loadAdminSignature(),
  ]);
  const appUrl = env.appUrl();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{document.title}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {document.clientName} · {document.pageCount} pages
          </p>
        </div>
        <StatusBadge status={document.status} />
      </div>

      <section className="rounded-md border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Signers</h2>
        <ul className="mt-3 divide-y divide-neutral-100">
          {signers.map((signer) => (
            <li key={signer.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <div>
                <span className="font-medium">{signer.name}</span>
                {signer.email && <span className="ml-2 text-neutral-500">{signer.email}</span>}
              </div>
              {signer.signedAt ? (
                <span className="text-xs text-green-700">
                  Signed {signer.signedAt.toLocaleString("en-PH", { timeZone: "Asia/Manila" })}
                </span>
              ) : document.status === "draft" ? (
                <span className="text-xs text-neutral-400">Link available after sending</span>
              ) : (
                <CopyLink url={`${appUrl}/sign/${signer.token}`} />
              )}
            </li>
          ))}
        </ul>
      </section>

      {document.status === "draft" && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Place signature boxes</h2>
              <p className="text-xs text-neutral-500">
                Pick who the box is for, then click on the page. Drag a box to move it. Save, then send.
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

      {document.status === "awaiting_countersign" && (
        <section className="rounded-md border border-blue-200 bg-blue-50 p-4">
          <h2 className="text-sm font-semibold text-blue-900">Everyone has signed. Your turn.</h2>
          <p className="mt-1 text-sm text-blue-800">
            Review the signed document below, then countersign with your saved signature.
          </p>
          <div className="mt-3">
            <CountersignButton documentId={id} hasSavedSignature={!!adminSignature?.signaturePng} />
          </div>
        </section>
      )}

      {document.status === "completed" && (
        <section className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <p className="font-semibold">Completed {document.completedAt?.toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</p>
          <p className="mt-1">
            SHA-256: <code className="text-xs">{document.finalSha256}</code>
          </p>
          <a
            href={`/api/documents/${id}/pdf?final=1`}
            className="mt-3 inline-block rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white"
          >
            Download signed PDF
          </a>
        </section>
      )}

      {document.status !== "draft" && (
        <section>
          <h2 className="text-sm font-semibold">Document</h2>
          <iframe
            src={`/api/documents/${id}/pdf${document.status === "completed" ? "?final=1" : ""}`}
            className="mt-3 h-[80vh] w-full rounded-md border border-neutral-200 bg-white"
            title="Document preview"
          />
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold">Activity</h2>
        <ul className="mt-3 flex flex-col gap-1 text-xs text-neutral-600">
          {audit.map((event) => (
            <li key={event.id}>
              {event.at.toLocaleString("en-PH", { timeZone: "Asia/Manila" })} · {event.actor} · {event.action}
              {event.detail && <span className="text-neutral-400"> · {event.detail}</span>}
              {event.ip && <span className="text-neutral-400"> · {event.ip}</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
