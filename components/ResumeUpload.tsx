"use client";
import { useRef, useState } from "react";
import { ocrFile } from "./ocr";

type State = { kind: "idle" } | { kind: "busy"; msg: string; pct?: number } | { kind: "done"; msg: string } | { kind: "error"; msg: string };

const wordCount = (t: string) => t.split(/\s+/).filter(Boolean).length;

export function ResumeUpload({ targetId }: { targetId: string }) {
  const [s, setS] = useState<State>({ kind: "idle" });
  const input = useRef<HTMLInputElement>(null);

  async function handle(f: File) {
    const fill = (text: string) => {
      (document.getElementById(targetId) as HTMLTextAreaElement).value = text;
      setS({ kind: "done", msg: `Read ${wordCount(text)} words from ${f.name}. Check the text below and fix anything that looks off.` });
    };
    const fail = (msg: string) => setS({ kind: "error", msg });
    const isImage = /\.(png|jpe?g)$/i.test(f.name);
    try {
      if (!isImage) {
        setS({ kind: "busy", msg: "Opening your file" });
        const ctl = new AbortController();
        const t = setTimeout(() => ctl.abort(), 30_000);
        const fd = new FormData();
        fd.set("file", f);
        const r = await fetch("/api/profile/resume", { method: "POST", body: fd, signal: ctl.signal }).finally(() => clearTimeout(t));
        const j = await r.json().catch(() => ({ error: "The server sent back something unexpected." }));
        if (j.text) return fill(j.text);
        if (j.error) return fail(j.error);
      }
      // Image-only PDF or a photo: read it with text recognition in the browser.
      setS({ kind: "busy", msg: "This file is a picture of a resume, so I'm reading it with text recognition. Hang tight, this takes up to a minute." });
      let last = Date.now();
      const watchdog = setInterval(() => {
        if (Date.now() - last > 90_000) { clearInterval(watchdog); fail("Text recognition stalled. Please paste your resume text instead."); }
      }, 5_000);
      try {
        const text = await ocrFile(f, (msg, pct) => { last = Date.now(); setS((p) => (p.kind === "busy" ? { kind: "busy", msg, pct } : p)); });
        if (wordCount(text) < 30) return fail("I couldn't find readable text in that file. Try a clearer copy, or paste your resume text below.");
        fill(text);
      } finally {
        clearInterval(watchdog);
      }
    } catch (e) {
      fail(e instanceof DOMException && e.name === "AbortError" ? "That took too long. Try again, or paste your resume text below." : "Something went wrong reading that file. You can paste your resume text below instead.");
    }
  }

  return (
    <div className="space-y-2">
      <input ref={input} type="file" accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg" disabled={s.kind === "busy"} className="text-sm"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }} />
      {s.kind === "busy" && (
        <div role="status" className="rounded-xl bg-brand-soft p-3 text-sm text-brand">
          <p className="font-medium">{s.msg}{s.pct != null ? ` ${s.pct}%` : ""}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white"><div className={`h-full rounded-full bg-brand transition-all ${s.pct == null ? "w-1/3 animate-pulse" : ""}`} style={s.pct != null ? { width: `${s.pct}%` } : undefined} /></div>
        </div>
      )}
      {s.kind === "done" && <p role="status" className="rounded-xl bg-[#e3f5ea] p-3 text-sm font-medium text-good">{s.msg}</p>}
      {s.kind === "error" && <p role="alert" className="rounded-xl bg-[#fde8e8] p-3 text-sm font-medium text-danger">{s.msg}</p>}
    </div>
  );
}
