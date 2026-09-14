"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { countersign } from "../../actions";

type Props = { documentId: string; hasSavedSignature: boolean };

export function CountersignButton({ documentId, hasSavedSignature }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!hasSavedSignature) {
    return (
      <p className="text-sm text-blue-900">
        Save your signature in <Link href="/admin/settings" className="underline">Settings</Link> first.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              setError(null);
              await countersign(documentId);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not countersign");
            }
          })
        }
        className="self-start rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Signing and finalising…" : "Countersign and finalise"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
