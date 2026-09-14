"use client";

import { useState, useTransition } from "react";
import { deleteDocument } from "../../actions";

export function DeleteButton({ documentId, title }: { documentId: string; title: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="btn btn-quiet px-0 text-xs">
        Delete document
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-bad-ink/20 bg-bad px-4 py-3 text-sm text-bad-ink">
      <span>Delete “{title}” and its PDFs? Signing links stop working. This cannot be undone.</span>
      <div className="ml-auto flex gap-2">
        <button type="button" onClick={() => setConfirming(false)} className="btn btn-quiet py-1.5 text-xs">
          Keep
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await deleteDocument(documentId);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not delete");
              }
            })
          }
          className="btn py-1.5 text-xs bg-bad-ink text-white"
        >
          {pending ? "Deleting" : "Delete"}
        </button>
      </div>
      {error && <p className="w-full text-xs">{error}</p>}
    </div>
  );
}
