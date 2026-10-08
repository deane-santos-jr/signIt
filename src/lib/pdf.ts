import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { Field } from "@/db/schema";

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Buffer.from(digest).toString("hex");
}

export async function pageCountOf(bytes: Uint8Array): Promise<number> {
  const pdf = await PDFDocument.load(bytes);
  return pdf.getPageCount();
}

type Stamp = {
  field: Pick<Field, "pageIndex" | "x" | "y" | "width" | "height">;
  signaturePngDataUrl: string;
};

function pngBytesFromDataUrl(dataUrl: string): Uint8Array {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  return new Uint8Array(Buffer.from(base64, "base64"));
}

function formatStamp(date: Date): string {
  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export async function stampSignature(
  pdfBytes: Uint8Array,
  stamp: Stamp,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes);
  const page = pdf.getPage(stamp.field.pageIndex);
  const png = await pdf.embedPng(pngBytesFromDataUrl(stamp.signaturePngDataUrl));

  const { x, y, width, height } = stamp.field;
  const scaled = png.scaleToFit(width, height);
  page.drawImage(png, {
    x: x + (width - scaled.width) / 2,
    y: y + (height - scaled.height) / 2,
    width: scaled.width,
    height: scaled.height,
  });
  return pdf.save();
}

export type TextFit = {
  font: PDFFont;
  size: number;
  maxWidth: number;
  maxLines: number;
};

const ELLIPSIS = "…";

function fits(text: string, fit: TextFit): boolean {
  return fit.font.widthOfTextAtSize(text, fit.size) <= fit.maxWidth;
}

function splitToWidth(word: string, fit: TextFit): string[] {
  const pieces = [""];
  for (const char of word) {
    const last = pieces[pieces.length - 1];
    if (last === "" || fits(last + char, fit)) pieces[pieces.length - 1] = last + char;
    else pieces.push(char);
  }
  return pieces;
}

function wrapWords(text: string, fit: TextFit): string[] {
  const lines: string[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const extended = lines.length > 0 ? `${lines[lines.length - 1]} ${word}` : null;
    if (extended !== null && fits(extended, fit)) lines[lines.length - 1] = extended;
    else lines.push(...splitToWidth(word, fit));
  }
  return lines;
}

function dropLastWord(text: string): string {
  const lastSpace = text.lastIndexOf(" ");
  return lastSpace > 0 ? text.slice(0, lastSpace) : text.slice(0, -1);
}

function endWithEllipsis(line: string, fit: TextFit): string {
  let kept = line;
  while (kept && !fits(kept + ELLIPSIS, fit)) kept = dropLastWord(kept);
  return kept + ELLIPSIS;
}

export function wrapText(text: string, fit: TextFit): string[] {
  const lines = wrapWords(text, fit);
  if (lines.length <= fit.maxLines) return lines;
  const kept = lines.slice(0, fit.maxLines);
  kept[kept.length - 1] = endWithEllipsis(kept[kept.length - 1], fit);
  return kept;
}

export type AuditLine = {
  name: string;
  role: string;
  signedAt: Date;
  ip: string | null;
  userAgent: string | null;
};

type AuditPage = {
  documentTitle: string;
  documentId: string;
  originalSha256: string;
  lines: AuditLine[];
};

export async function appendAuditPage(
  pdfBytes: Uint8Array,
  audit: AuditPage,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const [pageWidth, pageHeight] = [595.28, 841.89];
  const page = pdf.addPage([pageWidth, pageHeight]);
  const left = 56;
  const detailIndent = 12;
  const deviceFit: TextFit = {
    font,
    size: 8,
    maxWidth: pageWidth - 2 * left - detailIndent,
    maxLines: 3,
  };
  let cursor = 780;

  const write = (text: string, size = 10, useBold = false, indent = 0) => {
    page.drawText(text, {
      x: left + indent,
      y: cursor,
      size,
      font: useBold ? bold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
    cursor -= size + 6;
  };

  write("Signature certificate", 16, true);
  cursor -= 6;
  write(audit.documentTitle, 11, true);
  write(`Document ID: ${audit.documentId}`, 9);
  write(`SHA-256 of unsigned original: ${audit.originalSha256}`, 8);
  cursor -= 10;

  for (const line of audit.lines) {
    write(`${line.name} · ${line.role}`, 10, true);
    write(`Signed ${formatStamp(line.signedAt)} (Asia/Manila)`, 9, false, detailIndent);
    if (line.ip) write(`IP address: ${line.ip}`, 9, false, detailIndent);
    if (line.userAgent) {
      for (const deviceLine of wrapText(`Device: ${line.userAgent}`, deviceFit)) {
        write(deviceLine, deviceFit.size, false, detailIndent);
      }
    }
    cursor -= 6;
  }

  cursor -= 10;
  write(
    "Each signature was applied through a unique private link and stamped onto the document by signIt.",
    8,
  );
  write(
    "The hash above identifies the unsigned original; any change to it produces a different hash.",
    8,
  );

  return pdf.save();
}
