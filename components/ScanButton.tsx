"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ScanButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();
  return (
    <div className="flex items-center gap-3">
      <button
        className="btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMsg("");
          try {
            const r = await fetch("/api/scan", { method: "POST" });
            const j = await r.json();
            setMsg(j.error ? `Error: ${j.error}` : `Scanned ${j.candidates} new jobs, ${j.matched} matches, ${j.tailored ?? 0} resumes tailored${j.error ? ` (${j.error})` : ""}`);
            router.refresh();
          } catch {
            setMsg("Scan failed or timed out - check back shortly.");
          }
          setBusy(false);
        }}
      >
        {busy ? "Scanning (1-3 min)..." : "Scan now"}
      </button>
      {msg && <span className="text-sm text-slate-600">{msg}</span>}
    </div>
  );
}
