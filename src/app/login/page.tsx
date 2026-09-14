"use client";

import { useActionState } from "react";
import { requestLoginLink, type LoginState } from "./actions";

const initial: LoginState = { sent: false };

export default function LoginPage() {
  const [state, action, pending] = useActionState(requestLoginLink, initial);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold tracking-tight">signIt</h1>
      <p className="mt-1 text-sm text-neutral-500">Admin login</p>
      {state.sent ? (
        <p className="mt-8 rounded-md border border-neutral-200 p-4 text-sm">
          If that address is the admin email, a login link is on its way. It
          works once and expires in 15 minutes.
        </p>
      ) : (
        <form action={action} className="mt-8 flex flex-col gap-3">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "Sending…" : "Email me a login link"}
          </button>
        </form>
      )}
    </main>
  );
}
