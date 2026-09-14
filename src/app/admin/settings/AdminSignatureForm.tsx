"use client";

import { useCallback, useState, useTransition } from "react";
import { SignaturePad } from "@/components/SignaturePad";
import { saveAdminSignature } from "../actions";

export function AdminSignatureForm({ initialName }: { initialName: string }) {
  const [png, setPng] = useState<string | null>(null);
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const onChange = useCallback((value: string | null) => setPng(value), []);

  function submit() {
    if (!png) {
      setMessage("Draw your signature first.");
      return;
    }
    const formData = new FormData();
    formData.set("signaturePng", png);
    formData.set("signatureName", name);
    startTransition(async () => {
      try {
        await saveAdminSignature(formData);
        setMessage("Saved.");
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <SignaturePad onChange={onChange} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Name printed under the signature</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          placeholder="Deane Benjie B. Santos Jr."
        />
      </label>
      {message && <p className="text-sm text-neutral-600">{message}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save signature"}
      </button>
    </div>
  );
}
