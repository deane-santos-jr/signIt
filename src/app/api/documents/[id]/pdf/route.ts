import { loadDocument } from "@/lib/documents";
import { pdfContentDisposition, pdfFileName, signedPdfFileName } from "@/lib/pdfFiles";
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

  const search = new URL(request.url).searchParams;
  const { title, workingUrl } = bundle.document;
  const finalUrl = search.get("final") === "1" ? bundle.document.finalUrl : null;
  const fileName = finalUrl ? signedPdfFileName(title) : pdfFileName(title);
  const delivery = search.get("download") === "1" ? "download" : "preview";

  const bytes = await fetchPdf(finalUrl ?? workingUrl);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, no-store",
      "Content-Disposition": pdfContentDisposition(delivery, fileName),
    },
  });
}
