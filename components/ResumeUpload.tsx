"use client";
import { useState } from "react";

export function ResumeUpload({ targetId }: { targetId: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div>
      <input
        type="file"
        accept=".pdf,.docx,.txt,.md"
        disabled={busy}
        className="text-sm"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          setErr("");
          const fd = new FormData();
          fd.set("file", f);
          const r = await fetch("/api/profile/resume", { method: "POST", body: fd });
          const j = await r.json();
          if (j.text) (document.getElementById(targetId) as HTMLTextAreaElement).value = j.text;
          else setErr(j.error ?? "Could not read file");
          setBusy(false);
        }}
      />
      {busy && <span className="ml-2 text-sm text-slate-500">Reading...</span>}
      {err && <span className="ml-2 text-sm text-red-600">{err}</span>}
    </div>
  );
}
