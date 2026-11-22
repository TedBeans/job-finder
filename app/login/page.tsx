"use client";
import { useActionState } from "react";
import { signIn } from "../actions";

export default function Login() {
  const [state, action, pending] = useActionState(signIn, null as null | { error?: string; sent?: boolean });
  return (
    <div className="mx-auto mt-24 max-w-sm card">
      <h1 className="mb-1 text-xl font-bold">Job Finder</h1>
      <p className="mb-4 text-sm text-slate-600">Enter your email and we&apos;ll send a sign-in link.</p>
      {state?.sent ? (
        <p className="text-sm text-green-700">Check your inbox for the link.</p>
      ) : (
        <form action={action} className="space-y-3">
          <input name="email" type="email" required placeholder="you@example.com" className="input" />
          <button className="btn w-full" disabled={pending}>{pending ? "Sending..." : "Send link"}</button>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
