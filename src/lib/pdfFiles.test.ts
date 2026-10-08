import { test } from "node:test";
import assert from "node:assert/strict";
import { pdfContentDisposition, pdfFileName, signedPdfFileName } from "./pdfFiles";

test("a preview is served inline so the browser renders it", () => {
  assert.equal(
    pdfContentDisposition("preview", "Retainer-signed.pdf"),
    'inline; filename="Retainer-signed.pdf"',
  );
});

test("a download is served as an attachment", () => {
  assert.equal(
    pdfContentDisposition("download", "Retainer-signed.pdf"),
    'attachment; filename="Retainer-signed.pdf"',
  );
});

test("file names stay valid header values whatever the title holds", () => {
  const title = 'Kasunduan — "Ñiño" & Co.';
  assert.equal(signedPdfFileName(title), "Kasunduan-i-o-Co-signed.pdf");
  assert.equal(pdfFileName(title), "Kasunduan-i-o-Co.pdf");
  assert.doesNotThrow(
    () => new Headers({ "Content-Disposition": pdfContentDisposition("preview", signedPdfFileName(title)) }),
  );
});
