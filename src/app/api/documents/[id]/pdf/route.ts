import { loadDocument } from "@/lib/documents";
import { requireAdmin } from "@/lib/session";
import { fetchPdf } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: RouteContext<"/api/documents/[id]/pdf">,
) {
  await requireAdmin();
  const { id } = await params;
  const bundle = await loadDocument(id);
  if (!bundle) return new Response("Not found", { status: 404 });

  const wantsFinal = new URL(request.url).searchParams.get("final") === "1";
  const url =
    wantsFinal && bundle.document.finalUrl
      ? bundle.document.finalUrl
      : bundle.document.workingUrl;
  const bytes = await fetchPdf(url);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, no-store",
      "Content-Disposition": wantsFinal
        ? `attachment; filename="${bundle.document.title.replace(/"/g, "")}-signed.pdf"`
        : "inline",
    },
  });
}
