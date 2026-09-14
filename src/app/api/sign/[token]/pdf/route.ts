import { loadSignerByToken } from "@/lib/documents";
import { fetchPdf } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/sign/[token]/pdf">,
) {
  const { token } = await params;
  const found = await loadSignerByToken(token);
  if (!found || found.bundle.document.status === "draft") {
    return new Response("Not found", { status: 404 });
  }
  const { document } = found.bundle;
  const bytes = await fetchPdf(document.finalUrl ?? document.workingUrl);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, no-store",
    },
  });
}
