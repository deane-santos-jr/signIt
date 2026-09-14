"use client";

import { useState, useTransition } from "react";
import { createDocument } from "../actions";

type SignerDraft = { name: string; email: string };

export function NewDocumentForm() {
  const [signers, setSigners] = useState<SignerDraft[]>([{ name: "", email: "" }]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update(index: number, patch: Partial<SignerDraft>) {
    setSigners((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function submit(formData: FormData) {
    formData.set("signers", JSON.stringify(signers.filter((s) => s.name.trim())));
    setError(null);
    startTransition(async () => {
      try {
        await createDocument(formData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    });
  }

  return (
    <form action={submit} className="card reveal mt-8 flex flex-col gap-7 p-8">
      <label className="flex flex-col gap-1.5">
        <span className="label">Title</span>
        <input name="title" required className="field" placeholder="Agreement name as the client will see it" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Client</span>
        <input name="clientName" required className="field" placeholder="Business or person" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="label">PDF</span>
        <span className="flex cursor-pointer items-center justify-between rounded-md border border-dashed border-line-strong bg-canvas px-4 py-4 text-sm transition-colors hover:border-ink">
          <span className={fileName ? "text-ink" : "text-ink-muted"}>
            {fileName ?? "Choose a PDF"}
          </span>
          <span className="text-xs text-ink-muted">Browse</span>
          <input
            name="file"
            type="file"
            accept="application/pdf"
            required
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </span>
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="label mb-1.5">Signers</legend>
        {signers.map((signer, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={signer.name}
              onChange={(e) => update(index, { name: e.target.value })}
              placeholder="Full name"
              className="field"
              required={index === 0}
            />
            <input
              value={signer.email}
              onChange={(e) => update(index, { email: e.target.value })}
              placeholder="Email, optional"
              type="email"
              className="field"
            />
            {signers.length > 1 && (
              <button
                type="button"
                onClick={() => setSigners((prev) => prev.filter((_, i) => i !== index))}
                className="btn btn-quiet px-2"
                aria-label="Remove signer"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSigners((prev) => [...prev, { name: "", email: "" }])}
          className="self-start text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
        >
          Add another signer
        </button>
      </fieldset>

      {error && <p className="rounded-md bg-bad px-3 py-2 text-sm text-bad-ink">{error}</p>}
      <div className="flex items-center justify-between border-t border-line pt-6">
        <p className="text-xs text-ink-muted">Nothing is sent until you place boxes and mark it sent.</p>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Uploading" : "Continue"}
        </button>
      </div>
    </form>
  );
}
