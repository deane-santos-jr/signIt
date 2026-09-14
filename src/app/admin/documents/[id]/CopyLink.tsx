"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <code className="max-w-[240px] truncate rounded bg-canvas px-2 py-1 font-mono text-[11px] text-ink-muted">
        {url}
      </code>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="btn btn-secondary px-3 py-1.5 text-xs"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
