"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <code className="max-w-[260px] truncate rounded bg-neutral-100 px-2 py-1 text-xs">{url}</code>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
