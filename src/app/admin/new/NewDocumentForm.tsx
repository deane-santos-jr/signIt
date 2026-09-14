"use client";

import { useState, useTransition } from "react";
import { createDocument } from "../actions";

type SignerDraft = { name: string; email: string };

const input =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function NewDocumentForm() {
  const [signers, setSigners] = useState<SignerDraft[]>([{ name: "", email: "" }]);
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
    <form action={submit} className="mt-6 flex flex-col gap-5">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Title</span>
        <input name="title" required className={input} placeholder="Aspire Website – Phase 1 Agreement" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Client</span>
        <input name="clientName" required className={input} placeholder="Aspire" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">PDF</span>
        <input name="file" type="file" accept="application/pdf" required className="text-sm" />
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Signers</legend>
        {signers.map((signer, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={signer.name}
              onChange={(e) => update(index, { name: e.target.value })}
              placeholder="Full name"
              className={input}
              required={index === 0}
            />
            <input
              value={signer.email}
              onChange={(e) => update(index, { email: e.target.value })}
              placeholder="Email (optional)"
              type="email"
              className={input}
            />
            {signers.length > 1 && (
              <button
                type="button"
                onClick={() => setSigners((prev) => prev.filter((_, i) => i !== index))}
                className="px-2 text-neutral-400 hover:text-red-600"
                aria-label="Remove signer"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSigners((prev) => [...prev, { name: "", email: "" }])}
          className="self-start text-sm text-neutral-600 underline"
        >
          Add another signer
        </button>
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Uploading…" : "Continue to place signature boxes"}
      </button>
    </form>
  );
}
