"use client";
import { useActionState } from "react";
import { signIn } from "../actions";

export default function Login() {
  const [state, action, pending] = useActionState(signIn, null as null | { error?: string; sent?: boolean });
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand p-12 text-white lg:flex">
        <span className="font-display text-xl font-extrabold">Job Finder</span>
        <div>
          <div className="font-display text-[200px] font-extrabold leading-none tracking-tight text-sun">94</div>
          <p className="mt-4 max-w-sm text-xl font-medium leading-snug">Every job gets a fit score. Your best matches arrive with a resume already tailored to them.</p>
        </div>
        <span className="text-sm text-white/70">Search, match, tailor, apply, track.</span>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-extrabold">Sign in</h1>
          <p className="mt-2 text-muted">Enter your email and we&apos;ll send you a link. No password needed.</p>
          {state?.sent ? (
            <p className="mt-6 rounded-xl bg-brand-soft p-4 text-sm font-medium text-brand">Link sent. Check your inbox, and your spam folder if it&apos;s not there in a minute.</p>
          ) : (
            <form action={action} className="mt-6 space-y-3">
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required placeholder="you@example.com" className="input" />
              <button className="btn w-full" disabled={pending}>{pending ? "Sending" : "Email me a link"}</button>
              {state?.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
