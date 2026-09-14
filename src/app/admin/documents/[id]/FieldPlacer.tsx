"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { PdfPages, boxStyle, type PageGeometry } from "@/components/PdfPages";
import { saveFields } from "../../actions";

export type FieldDraft = {
  owner: "signer" | "admin";
  signerId: string | null;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  documentId: string;
  pdfUrl: string;
  signers: { id: string; name: string }[];
  initialFields: FieldDraft[];
};

const BOX = { width: 170, height: 56 };
const ADMIN = "__admin__";

export function FieldPlacer({ documentId, pdfUrl, signers, initialFields }: Props) {
  const [fields, setFields] = useState<FieldDraft[]>(initialFields);
  const [target, setTarget] = useState<string>(signers[0]?.id ?? ADMIN);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [drag, setDrag] = useState<{ index: number; dx: number; dy: number } | null>(null);

  const labelFor = (field: FieldDraft) =>
    field.owner === "admin" ? "You" : signers.find((s) => s.id === field.signerId)?.name ?? "?";

  function place(page: PageGeometry, xPt: number, yPt: number) {
    if (drag) return;
    const field: FieldDraft = {
      owner: target === ADMIN ? "admin" : "signer",
      signerId: target === ADMIN ? null : target,
      pageIndex: page.index,
      x: clamp(xPt - BOX.width / 2, 0, page.widthPt - BOX.width),
      y: clamp(yPt - BOX.height / 2, 0, page.heightPt - BOX.height),
      ...BOX,
    };
    setFields((prev) => [...prev, field]);
    setDirty(true);
  }

  function remove(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }

  function save() {
    startTransition(async () => {
      try {
        await saveFields(documentId, fields);
        setDirty(false);
        setMessage("Saved.");
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-neutral-200 bg-white p-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-neutral-600">Box for</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1"
          >
            {signers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
            <option value={ADMIN}>You (countersign)</option>
          </select>
        </label>
        <span className="text-neutral-400">then click on the page</span>
        <div className="ml-auto flex items-center gap-3">
          {message && <span className="text-neutral-500">{message}</span>}
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="rounded-md bg-neutral-900 px-3 py-1.5 font-medium text-white disabled:opacity-40"
          >
            {pending ? "Saving…" : "Save boxes"}
          </button>
        </div>
      </div>

      <PdfPages
        url={pdfUrl}
        onPageClick={place}
        overlay={(page) => (
          <>
            {fields.map((field, index) => {
              if (field.pageIndex !== page.index) return null;
              const style: CSSProperties = { position: "absolute", ...boxStyle(page, field) };
              const isAdmin = field.owner === "admin";
              return (
                <div
                  key={index}
                  style={style}
                  className={`group flex cursor-move items-end justify-between border-2 border-dashed text-[10px] font-medium ${
                    isAdmin ? "border-blue-500 bg-blue-500/10 text-blue-800" : "border-amber-500 bg-amber-400/10 text-amber-900"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDrag({ index, dx: e.clientX - rect.left, dy: e.clientY - rect.top });
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (!drag || drag.index !== index) return;
                    const pageRect = e.currentTarget.parentElement!.getBoundingClientRect();
                    const leftPx = e.clientX - pageRect.left - drag.dx;
                    const topPx = e.clientY - pageRect.top - drag.dy;
                    const x = clamp(leftPx / page.scale, 0, page.widthPt - field.width);
                    const yFromTop = topPx / page.scale;
                    const y = clamp(page.heightPt - yFromTop - field.height, 0, page.heightPt - field.height);
                    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, x, y } : f)));
                    setDirty(true);
                  }}
                  onPointerUp={() => setTimeout(() => setDrag(null), 0)}
                >
                  <span className="px-1">{labelFor(field)}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(index);
                    }}
                    className="px-1 text-neutral-500 opacity-0 group-hover:opacity-100"
                    aria-label="Remove box"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </>
        )}
      />
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
