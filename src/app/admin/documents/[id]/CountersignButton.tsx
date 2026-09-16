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
      <p className="text-sm text-info-ink">
        Save your signature under{" "}
        <Link href="/admin/settings" className="underline underline-offset-4">
          Signature
        </Link>{" "}
        first.
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
            setError(null);
            const result = await countersign(documentId);
            if (!result.ok) setError(result.error);
          })
        }
        className="btn btn-primary self-start"
      >
        {pending ? "Signing and finalising" : "Countersign and finalise"}
      </button>
      {error && <p className="text-xs text-bad-ink">{error}</p>}
    </div>
  );
}
