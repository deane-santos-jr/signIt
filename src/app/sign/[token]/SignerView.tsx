"use client";

import { useCallback, useState, useTransition } from "react";
import { PdfPages, boxStyle } from "@/components/PdfPages";
import { SignaturePad } from "@/components/SignaturePad";
import { Wordmark } from "@/components/Wordmark";
import { submitSignature } from "./actions";

type Box = { pageIndex: number; x: number; y: number; width: number; height: number };

type Props = {
  token: string;
  signerName: string;
  documentTitle: string;
  clientName: string;
  alreadySigned: boolean;
  completed: boolean;
  fields: Box[];
};

export function SignerView(props: Props) {
  const [open, setOpen] = useState(false);
  const [png, setPng] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(props.alreadySigned);
  const [pending, startTransition] = useTransition();
  const onChange = useCallback((value: string | null) => setPng(value), []);

  function submit() {
    if (!png) {
      setError("Draw your signature first.");
      return;
    }
    startTransition(async () => {
      const result = await submitSignature(props.token, png);
      if (result.ok) {
        setDone(true);
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-serif text-lg leading-tight">{props.documentTitle}</p>
            <p className="text-xs text-ink-muted">
              {props.clientName} · signing as {props.signerName}
            </p>
          </div>
          {done ? (
            <span className="tag bg-ok text-ok-ink">
              {props.completed ? "Completed by all parties" : "Signed"}
            </span>
          ) : (
            <button type="button" onClick={() => setOpen(true)} className="btn btn-primary">
              Sign document
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {done && !props.completed && (
          <p className="reveal mb-5 rounded-lg border border-ok-ink/20 bg-ok px-4 py-3 text-sm text-ok-ink">
            Thank you. You will receive the completed copy once everyone has signed.
          </p>
        )}
        {!done && (
          <p className="mb-5 text-sm text-ink-muted">
            Read through, then press <span className="text-ink">Sign document</span> or tap a highlighted box.
          </p>
        )}
        <PdfPages
          url={`/api/sign/${props.token}/pdf`}
          overlay={(page) =>
            done
              ? null
              : props.fields
                  .filter((f) => f.pageIndex === page.index)
                  .map((f, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setOpen(true)}
                      style={{ position: "absolute", ...boxStyle(page, f) }}
                      className="flex items-center justify-center rounded-sm border border-sign-line bg-sign/90 text-xs font-medium text-sign-ink transition-colors hover:bg-sign"
                    >
                      Sign here
                    </button>
                  ))
          }
        />
        <p className="mt-10 text-center text-xs text-ink-faint">
          Secured by <Wordmark className="text-sm text-ink-muted" />
        </p>
      </main>

      {open && !done && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/30 sm:items-center sm:p-6">
          <div className="reveal w-full max-w-md rounded-t-xl bg-white p-6 sm:rounded-xl">
            <p className="font-serif text-2xl">Your signature</p>
            <p className="mt-1 text-xs text-ink-muted">
              Draw with your finger or mouse. It is placed on every box marked for you.
            </p>
            <div className="mt-5">
              <SignaturePad onChange={onChange} />
            </div>
            <label className="mt-5 flex items-start gap-2.5 text-xs leading-relaxed text-ink-muted">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-ink"
              />
              <span>
                I, {props.signerName}, agree that this electronic signature is the legal equivalent of my handwritten signature on this document.
              </span>
            </label>
            {error && <p className="mt-3 text-sm text-bad-ink">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn btn-quiet">
                Cancel
              </button>
              <button type="button" onClick={submit} disabled={pending || !png || !agreed} className="btn btn-primary">
                {pending ? "Applying" : "Apply signature"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
