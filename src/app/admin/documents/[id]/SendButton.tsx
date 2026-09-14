"use client";

import { useState, useTransition } from "react";
import { markSent } from "../../actions";

export function SendButton({ documentId }: { documentId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              setError(null);
              await markSent(documentId);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not send");
            }
          })
        }
        className="rounded-md border border-neutral-900 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Sending…" : "Mark as sent and get links"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
