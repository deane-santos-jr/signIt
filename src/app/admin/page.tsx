import Link from "next/link";
import { listDocuments } from "@/lib/documents";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});

export default async function AdminHome() {
  const docs = await listDocuments();

  return (
    <div>
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl">Documents</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {docs.length === 0 ? "Nothing sent yet." : `${docs.length} in total`}
          </p>
        </div>
        <Link href="/admin/new" className="btn btn-primary">
          New document
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="card reveal mt-10 px-8 py-14 text-center">
          <p className="font-serif text-2xl">Start with a PDF.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            Upload the agreement, name who signs, place the boxes, and send each person a private link.
          </p>
          <Link href="/admin/new" className="btn btn-secondary mt-6">
            Upload a document
          </Link>
        </div>
      ) : (
        <ul className="card mt-10 divide-y divide-line">
          {docs.map((doc, i) => (
            <li key={doc.id} className="reveal" style={{ ["--i" as string]: i }}>
              <Link
                href={`/admin/documents/${doc.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-canvas"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{doc.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {doc.clientName} · {dateFormat.format(doc.createdAt)}
                  </p>
                </div>
                <StatusBadge status={doc.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
