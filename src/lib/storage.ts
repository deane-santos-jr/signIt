import { del, get, put } from "@vercel/blob";

export async function storePdf(
  path: string,
  bytes: Uint8Array,
): Promise<string> {
  const blob = await put(path, Buffer.from(bytes), {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function fetchPdf(url: string): Promise<Uint8Array> {
  const result = await get(url, { access: "private", useCache: false });
  if (!result?.stream) throw new Error(`Blob not found: ${url}`);
  return new Uint8Array(await new Response(result.stream).arrayBuffer());
}

export async function deletePdfs(urls: string[]): Promise<void> {
  const unique = [...new Set(urls)];
  if (unique.length > 0) await del(unique);
}
