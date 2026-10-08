import { test } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";
import { wrapText, type TextFit } from "./pdf";

const SAFARI_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";

async function helvetica(): Promise<PDFFont> {
  const pdf = await PDFDocument.create();
  return pdf.embedFont(StandardFonts.Helvetica);
}

function widthOf(line: string, fit: TextFit): number {
  return fit.font.widthOfTextAtSize(line, fit.size);
}

test("a long device string wraps at word boundaries instead of being cut mid-word", async () => {
  const fit = { font: await helvetica(), size: 8, maxWidth: 300, maxLines: 3 };
  const lines = wrapText(`Device: ${SAFARI_IOS}`, fit);

  assert.ok(lines.length > 1);
  assert.equal(lines.join(" "), `Device: ${SAFARI_IOS}`);
  assert.ok(lines.some((line) => line.includes("Mobile/15E148")));
  for (const line of lines) assert.ok(widthOf(line, fit) <= fit.maxWidth, line);
});

test("text past the line limit ends in an ellipsis after a whole word", async () => {
  const fit = { font: await helvetica(), size: 8, maxWidth: 200, maxLines: 2 };
  const lines = wrapText(`Device: ${SAFARI_IOS}`, fit);

  assert.equal(lines.length, 2);
  assert.ok(lines[1].endsWith("…"));
  const lastWord = lines[1].slice(0, -1).split(" ").at(-1)!;
  assert.ok(SAFARI_IOS.split(" ").includes(lastWord), lastWord);
  for (const line of lines) assert.ok(widthOf(line, fit) <= fit.maxWidth, line);
});

test("a single word wider than the line is split so nothing overflows the page", async () => {
  const fit = { font: await helvetica(), size: 8, maxWidth: 100, maxLines: 10 };
  const token = "x".repeat(120);
  const lines = wrapText(token, fit);

  assert.equal(lines.join(""), token);
  for (const line of lines) assert.ok(widthOf(line, fit) <= fit.maxWidth, line);
});

test("short text stays on one line", async () => {
  const fit = { font: await helvetica(), size: 8, maxWidth: 300, maxLines: 3 };
  assert.deepEqual(wrapText("Device:  curl/8.7.1", fit), ["Device: curl/8.7.1"]);
});
