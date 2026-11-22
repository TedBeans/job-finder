"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { jobId: string; resume?: string; cover?: string; changes?: string[] };

export function TailorPanel({ jobId, resume, cover, changes }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();
  const copy = (t?: string) => t && navigator.clipboard.writeText(t);
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Tailored resume &amp; cover letter</h2>
        <button
          className="btn"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setErr("");
            const r = await fetch("/api/tailor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId }) });
            const j = await r.json();
            if (j.error) setErr(j.error);
            else router.refresh();
            setBusy(false);
          }}
        >
          {busy ? "Writing..." : resume ? "Regenerate" : "Tailor my resume"}
        </button>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {changes && changes.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {changes.map((c, i) => (
            <li key={i} className={c.startsWith("GAP:") ? "text-amber-700" : ""}>{c}</li>
          ))}
        </ul>
      )}
      {resume && (
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => copy(resume)}>Copy resume</button>
          <button className="btn-ghost" onClick={() => copy(cover)}>Copy cover letter</button>
          <a className="btn-ghost" href={`/jobs/${jobId}/print?doc=resume`} target="_blank">Print / save PDF - resume</a>
          <a className="btn-ghost" href={`/jobs/${jobId}/print?doc=cover`} target="_blank">Print / save PDF - cover letter</a>
        </div>
      )}
    </div>
  );
}
