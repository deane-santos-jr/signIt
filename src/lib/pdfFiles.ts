export type PdfDelivery = "preview" | "download";

function headerSafeSlug(title: string): string {
  return title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
}

export function pdfFileName(title: string): string {
  return `${headerSafeSlug(title)}.pdf`;
}

export function signedPdfFileName(title: string): string {
  return `${headerSafeSlug(title)}-signed.pdf`;
}

export function pdfContentDisposition(delivery: PdfDelivery, fileName: string): string {
  const type = delivery === "download" ? "attachment" : "inline";
  return `${type}; filename="${fileName}"`;
}
