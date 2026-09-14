"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

export type PageGeometry = {
  index: number;
  widthPt: number;
  heightPt: number;
  scale: number;
};

type Props = {
  url: string;
  overlay?: (page: PageGeometry) => ReactNode;
  onPageClick?: (page: PageGeometry, xPt: number, yPtFromBottom: number) => void;
};

const MAX_WIDTH_PX = 820;

async function openPdf(url: string): Promise<PDFDocumentProxy> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  return pdfjs.getDocument({ url, withCredentials: true }).promise;
}

type Loaded = { url: string; doc: PDFDocumentProxy };
type Rendered = { url: string; pages: PageGeometry[] };

export function PdfPages({ url, overlay, onPageClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [rendered, setRendered] = useState<Rendered | null>(null);
  const [error, setError] = useState<string | null>(null);
  const doc = loaded?.url === url ? loaded.doc : null;
  const pages = rendered?.url === url ? rendered.pages : [];

  useEffect(() => {
    let cancelled = false;
    openPdf(url)
      .then((opened) => {
        if (!cancelled) setLoaded({ url, doc: opened });
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    async function renderAll(opened: PDFDocumentProxy) {
      const container = containerRef.current;
      if (!container) return;
      const targetWidth = Math.min(container.clientWidth, MAX_WIDTH_PX);
      const geometries: PageGeometry[] = [];
      for (let i = 1; i <= opened.numPages; i++) {
        if (cancelled) return;
        const page = await opened.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const scale = targetWidth / base.width;
        const viewport = page.getViewport({ scale });
        const canvas = container.querySelector<HTMLCanvasElement>(
          `canvas[data-page="${i - 1}"]`,
        );
        if (!canvas) continue;
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        const context = canvas.getContext("2d")!;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        geometries.push({ index: i - 1, widthPt: base.width, heightPt: base.height, scale });
      }
      if (!cancelled) setRendered({ url, pages: geometries });
    }
    renderAll(doc).catch((e: unknown) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      cancelled = true;
    };
  }, [doc, url]);

  if (error) {
    return (
      <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
        Could not load PDF: {error}
      </p>
    );
  }

  return (
    <div ref={containerRef} className="flex w-full flex-col items-center gap-4">
      {!doc && <p className="text-sm text-neutral-500">Loading document…</p>}
      {Array.from({ length: doc?.numPages ?? 0 }, (_, index) => {
        const geometry = pages.find((p) => p.index === index);
        return (
          <div
            key={index}
            className="relative bg-white shadow-sm ring-1 ring-neutral-200"
            onClick={(event) => {
              if (!geometry || !onPageClick) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const xPt = (event.clientX - rect.left) / geometry.scale;
              const yFromTopPt = (event.clientY - rect.top) / geometry.scale;
              onPageClick(geometry, xPt, geometry.heightPt - yFromTopPt);
            }}
          >
            <canvas data-page={index} className="block" />
            {geometry && overlay?.(geometry)}
          </div>
        );
      })}
    </div>
  );
}

export function boxStyle(
  page: PageGeometry,
  field: { x: number; y: number; width: number; height: number },
) {
  return {
    left: field.x * page.scale,
    top: (page.heightPt - field.y - field.height) * page.scale,
    width: field.width * page.scale,
    height: field.height * page.scale,
  };
}
