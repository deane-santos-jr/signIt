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
        className="btn btn-secondary"
      >
        {pending ? "Locking" : "Mark as sent"}
      </button>
      {error && <p className="text-xs text-bad-ink">{error}</p>}
    </div>
  );
}
