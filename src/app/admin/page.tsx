import Link from "next/link";
import { listDocuments } from "@/lib/documents";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const docs = await listDocuments();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Documents</h1>
        <Link
          href="/admin/new"
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
        >
          New document
        </Link>
      </div>
      {docs.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          Nothing yet. Upload a PDF to start.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-white">
          {docs.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/admin/documents/${doc.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
              >
                <div>
                  <p className="text-sm font-medium">{doc.title}</p>
                  <p className="text-xs text-neutral-500">
                    {doc.clientName} · {doc.createdAt.toLocaleDateString("en-PH")}
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
