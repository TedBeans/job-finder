"use client";
import { useState } from "react";
import { buildInterviewPrompt } from "@/lib/interviewPrompt";

type Fill = Partial<{
  full_name: string; headline: string; target_titles: string[]; seniority: string[]; work_modes: string[];
  locations: string[]; min_salary: number | null; industries: string[]; must_haves: string; deal_breakers: string;
}>;

const el = (name: string) => document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
const setText = (name: string, v: string) => { const e = el(name); if (e) e.value = v; };
const setChecks = (name: string, values: string[]) =>
  document.querySelectorAll<HTMLInputElement>(`input[type=checkbox][name="${name}"]`).forEach((c) => (c.checked = values.includes(c.value)));

function parse(text: string): Fill | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export function ProfileAssist() {
  const [paste, setPaste] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <section className="sheet mt-6 space-y-4 p-6">
      <div>
        <h2 className="text-lg font-bold">Not sure what to put? Talk it through in a chat</h2>
        <p className="hint mt-1">Your own Claude or Muse interviews you about what you want, then gives you a summary that fills in the sections below. You can edit everything before saving.</p>
      </div>
      <ol className="space-y-3 text-sm">
        <li className="flex flex-wrap items-center gap-3">
          <span className="font-display text-2xl font-extrabold text-brand">1</span>
          <button type="button" className="btn btn-sm" onClick={async () => {
            const resume = (document.getElementById("resume_text") as HTMLTextAreaElement | null)?.value.trim() ?? "";
            if (resume.length < 80) return setMsg({ ok: false, text: "Add your resume first, so the chat can use it." });
            await navigator.clipboard.writeText(buildInterviewPrompt(resume));
            setCopied(true); setMsg(null); setTimeout(() => setCopied(false), 2500);
          }}>{copied ? "Copied" : "Copy the interview"}</button>
          <span className="hint">Paste it into a new chat in Claude or Muse and answer its questions.</span>
        </li>
        <li className="flex gap-3">
          <span className="font-display text-2xl font-extrabold text-brand">2</span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="hint">When the chat finishes, paste its final reply here.</p>
            <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={4} aria-label="Reply from the chat" placeholder="Paste the final reply here" className="input font-mono text-xs" />
            <button type="button" className="btn-ghost btn-sm" disabled={!paste.trim()} onClick={() => {
              const f = parse(paste);
              if (!f) return setMsg({ ok: false, text: "I couldn't find the summary in that. Paste the whole final reply, including the part in curly braces." });
              if (f.full_name) setText("full_name", f.full_name);
              if (f.headline) setText("headline", f.headline);
              if (f.target_titles) setText("target_titles", f.target_titles.join(", "));
              if (f.locations) setText("locations", f.locations.join(", "));
              if (f.industries) setText("industries", f.industries.join(", "));
              if (f.min_salary) setText("min_salary", String(f.min_salary));
              if (f.must_haves) setText("must_haves", f.must_haves);
              if (f.deal_breakers) setText("deal_breakers", f.deal_breakers);
              if (f.seniority) setChecks("seniority", f.seniority);
              if (f.work_modes) setChecks("work_modes", f.work_modes);
              setMsg({ ok: true, text: "Filled in below. Look it over, change anything you like, then save." });
              setPaste("");
            }}>Fill in my profile</button>
          </div>
        </li>
      </ol>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-xl p-3 text-sm font-medium ${msg.ok ? "bg-[#e3f5ea] text-good" : "bg-[#fde8e8] text-danger"}`}>{msg.text}</p>}
    </section>
  );
}
