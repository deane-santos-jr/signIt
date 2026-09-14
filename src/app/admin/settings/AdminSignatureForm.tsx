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
    <div className="card reveal mt-6 flex flex-col gap-5 p-6" style={{ ["--i" as string]: 1 }}>
      <div>
        <p className="label mb-2">Draw</p>
        <SignaturePad onChange={onChange} />
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="label">Printed name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="As it should appear under the signature" />
      </label>
      <div className="flex items-center justify-between border-t border-line pt-5">
        <p className="text-sm text-ink-muted">{message}</p>
        <button type="button" onClick={submit} disabled={pending} className="btn btn-primary">
          {pending ? "Saving" : "Save signature"}
        </button>
      </div>
    </div>
  );
}
