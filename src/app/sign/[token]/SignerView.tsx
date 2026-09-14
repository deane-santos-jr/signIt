"use client";

import { useCallback, useState, useTransition } from "react";
import { PdfPages, boxStyle } from "@/components/PdfPages";
import { SignaturePad } from "@/components/SignaturePad";
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
    <div className="min-h-screen pb-32">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{props.documentTitle}</p>
            <p className="text-xs text-neutral-500">
              {props.clientName} · signing as {props.signerName}
            </p>
          </div>
          {done ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              {props.completed ? "Completed by all parties" : "You have signed"}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
            >
              Sign document
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {done && !props.completed && (
          <p className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
            Thank you. You will receive the completed copy once everyone has signed.
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
                      className="flex items-center justify-center border-2 border-amber-500 bg-amber-300/30 text-xs font-medium text-amber-900"
                    >
                      Sign here
                    </button>
                  ))
          }
        />
      </main>

      {open && !done && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-md rounded-t-xl bg-white p-5 sm:rounded-xl">
            <h2 className="text-base font-semibold">Draw your signature</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Use your finger or mouse. It will be placed on every box marked for you.
            </p>
            <div className="mt-4">
              <SignaturePad onChange={onChange} />
            </div>
            <label className="mt-4 flex items-start gap-2 text-xs text-neutral-700">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I, {props.signerName}, agree that this electronic signature is the legal equivalent of my handwritten signature on this document.
              </span>
            </label>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-neutral-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending || !png || !agreed}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {pending ? "Applying…" : "Apply signature"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
