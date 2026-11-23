"use client";
import { useActionState } from "react";
import { importFromAgent } from "@/app/actions";

export function ImportBox() {
  const [state, action, pending] = useActionState(importFromAgent, null as null | { error?: string; ok?: string });
  return (
    <form action={action} className="space-y-2">
      <textarea name="payload" rows={8} required placeholder="Paste your agent's reply here (the JSON)..." className="input font-mono text-xs" />
      <button className="btn" disabled={pending}>{pending ? "Importing..." : "Import jobs"}</button>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-700">{state.ok}</p>}
    </form>
  );
}
