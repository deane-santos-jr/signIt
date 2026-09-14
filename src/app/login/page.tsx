"use client";

import { useActionState } from "react";
import { Wordmark } from "@/components/Wordmark";
import { requestLoginLink, type LoginState } from "./actions";

const initial: LoginState = { sent: false };

export default function LoginPage() {
  const [state, action, pending] = useActionState(requestLoginLink, initial);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Wordmark className="text-3xl" />
      <p className="mt-3 text-sm text-ink-muted">
        A login link is emailed to the admin address. No password.
      </p>
      {state.sent ? (
        <div className="card reveal mt-8 p-5 text-sm">
          <p className="font-medium">Check your inbox.</p>
          <p className="mt-1 text-ink-muted">
            If that address is the admin email, a link is on its way. It works once and expires in 15 minutes.
          </p>
        </div>
      ) : (
        <form action={action} className="card reveal mt-8 flex flex-col gap-3 p-5">
          <label className="flex flex-col gap-1.5">
            <span className="label">Email</span>
            <input name="email" type="email" required autoComplete="email" className="field" placeholder="you@yourdomain.com" />
          </label>
          {state.error && <p className="text-sm text-bad-ink">{state.error}</p>}
          <button type="submit" disabled={pending} className="btn btn-primary mt-1 justify-center">
            {pending ? "Sending" : "Email me a link"}
          </button>
        </form>
      )}
    </main>
  );
}
