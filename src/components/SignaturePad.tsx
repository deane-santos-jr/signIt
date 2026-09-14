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
      penColor: "#111827",
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
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        style={{ height }}
        className="w-full touch-none rounded-md border border-dashed border-neutral-400 bg-white"
      />
      <button
        type="button"
        onClick={() => {
          padRef.current?.clear();
          onChange(null);
        }}
        className="self-start text-xs text-neutral-500 underline"
      >
        Clear
      </button>
    </div>
  );
}
