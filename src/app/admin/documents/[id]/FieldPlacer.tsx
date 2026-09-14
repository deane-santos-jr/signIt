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

  const placedFor = (id: string) =>
    fields.some((f) => (id === ADMIN ? f.owner === "admin" : f.signerId === id));

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
    setMessage(null);
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
        setMessage("Saved");
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  const choices = [...signers.map((s) => ({ id: s.id, name: s.name })), { id: ADMIN, name: "You" }];

  return (
    <div className="flex flex-col gap-4">
      <div className="card sticky top-[65px] z-10 flex flex-wrap items-center gap-2 p-2 pl-3">
        <span className="label mr-1">Box for</span>
        {choices.map((c) => {
          const active = target === c.id;
          const done = placedFor(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setTarget(c.id)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                active ? "border-ink bg-ink text-white" : "border-line-strong bg-white text-ink hover:border-ink"
              }`}
            >
              {c.name}
              {done && <span className={`ml-2 text-xs ${active ? "text-white/60" : "text-ok-ink"}`}>placed</span>}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-3 pr-1">
          <span className="text-xs text-ink-muted">{message}</span>
          <button type="button" onClick={save} disabled={pending || !dirty} className="btn btn-primary py-1.5">
            {pending ? "Saving" : "Save boxes"}
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
                  className={`group flex cursor-move items-end justify-between rounded-sm border text-[11px] font-medium ${
                    isAdmin ? "border-info-ink/60 bg-info/70 text-info-ink" : "border-sign-line bg-sign/80 text-sign-ink"
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
                  <span className="px-1.5 pb-0.5">{labelFor(field)}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(index);
                    }}
                    className="px-1.5 pb-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove box"
                  >
                    remove
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
