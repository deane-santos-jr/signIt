"use client";

import { useEffect, useRef } from "react";
import SignaturePadLib from "signature_pad";

type Props = {
  onChange: (pngDataUrl: string | null) => void;
  height?: number;
};

export function SignaturePad({ onChange, height = 180 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const resize = () => {
      const data = padRef.current?.toData();
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      padRef.current?.clear();
      if (data) padRef.current?.fromData(data);
    };
    const pad = new SignaturePadLib(canvas, {
      penColor: "#111111",
      minWidth: 1,
      maxWidth: 2.5,
    });
    pad.addEventListener("endStroke", () => {
      onChange(pad.isEmpty() ? null : pad.toDataURL("image/png"));
    });
    padRef.current = pad;
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      pad.off();
    };
  }, [onChange]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        style={{ height }}
        className="w-full touch-none rounded-md border border-line-strong bg-white"
      />
      <span className="pointer-events-none absolute inset-x-6 bottom-9 border-b border-line-strong" />
      <button
        type="button"
        onClick={() => {
          padRef.current?.clear();
          onChange(null);
        }}
        className="absolute right-3 top-2 text-xs text-ink-muted hover:text-ink"
      >
        Clear
      </button>
    </div>
  );
}
