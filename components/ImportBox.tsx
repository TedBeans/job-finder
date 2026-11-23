"use client";
import { useActionState } from "react";
import { importFromAgent } from "@/app/actions";

export function ImportBox() {
  const [state, action, pending] = useActionState(importFromAgent, null as null | { error?: string; ok?: string });
  return (
    <form action={action} className="space-y-2">
      <textarea name="payload" rows={8} required placeholder="Paste the full reply from your agent here" className="input font-mono text-xs" />
      <button className="btn" disabled={pending}>{pending ? "Importing" : "Import jobs"}</button>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="text-sm text-good">{state.ok}</p>}
    </form>
  );
}
