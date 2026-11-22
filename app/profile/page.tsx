import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase";
import { saveProfile, rotateIngestToken } from "../actions";
import { headers } from "next/headers";
import { CopyButton } from "@/components/CopyButton";
import { ResumeUpload } from "@/components/ResumeUpload";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const { welcome } = await searchParams;
  const { data } = await auth.sb.from("profiles").select("*").eq("user_id", auth.user.id).maybeSingle<Profile>();
  const p = data;
  const modes = p?.work_modes ?? ["remote", "hybrid", "onsite"];
  const levels = ["entry", "mid", "senior", "lead", "manager", "director", "executive"];

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const endpoint = `${origin}/api/ingest`;
  const agentPrompt = p?.ingest_token
    ? `Every morning, search the web for current job postings that match what I'm looking for: ${p.target_titles.join(", ")}; ${p.work_modes.join("/")}; ${p.locations.join(", ")}${p.min_salary ? `; at least $${p.min_salary}/yr` : ""}. Skip anything that violates: ${p.deal_breakers ?? "n/a"}. Send up to 20 real, open postings (only URLs you actually opened) as a JSON POST to ${endpoint} with header "Authorization: Bearer ${p.ingest_token}" and body {"jobs":[{"title","company","url","location","work_mode":"remote|hybrid|onsite","salary_min","salary_max","description"}]}. Include the full description text when you can.`
    : "";
  return (
    <div className="mx-auto max-w-3xl space-y-5">
    <form action={saveProfile} className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">{welcome ? "Set up your profile" : "Profile & preferences"}</h1>
      <p className="text-sm text-slate-600">The more specific you are, the better the matches. Your resume is the source of truth - tailored versions only ever reuse facts from it.</p>

      <div className="card space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Full name</label><input name="full_name" defaultValue={p?.full_name ?? ""} className="input" required /></div>
          <div><label className="label">Headline</label><input name="headline" defaultValue={p?.headline ?? ""} placeholder="e.g. Supply chain analyst, 5 yrs CPG" className="input" /></div>
        </div>
        <div>
          <label className="label">Resume (upload PDF/DOCX/TXT or paste)</label>
          <ResumeUpload targetId="resume_text" />
          <textarea id="resume_text" name="resume_text" defaultValue={p?.resume_text ?? ""} rows={14} required className="input mt-2 font-mono" />
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">What you&apos;re looking for</h2>
        <div><label className="label">Target job titles (comma-separated)</label><input name="target_titles" defaultValue={p?.target_titles?.join(", ")} className="input" required /></div>
        <div>
          <span className="label">Seniority</span>
          <div className="flex flex-wrap gap-3 text-sm">{levels.map((l) => (<label key={l}><input type="checkbox" name="seniority" value={l} defaultChecked={p?.seniority?.includes(l)} /> {l}</label>))}</div>
        </div>
        <div>
          <span className="label">Work arrangement</span>
          <div className="flex gap-4 text-sm">{["remote", "hybrid", "onsite"].map((m) => (<label key={m}><input type="checkbox" name="work_modes" value={m} defaultChecked={modes.includes(m)} /> {m}</label>))}</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Locations (for hybrid/on-site)</label><input name="locations" defaultValue={p?.locations?.join(", ")} placeholder="St. Louis, MO" className="input" /></div>
          <div><label className="label">Minimum salary (USD/yr)</label><input name="min_salary" defaultValue={p?.min_salary ?? ""} placeholder="90000" className="input" /></div>
        </div>
        <div><label className="label">Industries (optional)</label><input name="industries" defaultValue={p?.industries?.join(", ")} placeholder="CPG, logistics, food & beverage" className="input" /></div>
        <div><label className="label">Must-haves</label><textarea name="must_haves" defaultValue={p?.must_haves ?? ""} rows={2} placeholder="Strong benefits, growth path, uses NetSuite..." className="input" /></div>
        <div><label className="label">Deal-breakers</label><textarea name="deal_breakers" defaultValue={p?.deal_breakers ?? ""} rows={2} placeholder="No travel over 25%, no commission-only..." className="input" /></div>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Scanning</h2>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="scan_enabled" defaultChecked={p?.scan_enabled ?? true} /> Scan for new jobs every day</label>
        <div><label className="label">Minimum match score to show (30-95)</label><input type="number" name="min_score" min={30} max={95} defaultValue={p?.min_score ?? 70} className="input w-28" /></div>
      </div>

      <button className="btn">Save profile</button>
    </form>

    {p && (
      <div className="card space-y-3">
        <h2 className="font-semibold">Use your own AI agent to find jobs (optional)</h2>
        <p className="text-sm text-slate-600">
          The app already scans daily on its own. If you also use an agent like Muse, you can give it a standing daily task that sends jobs here; they get scored, matched and tailored the same way.
          Whether your agent can make web requests depends on the product - test it once.
        </p>
        {p.ingest_token ? (
          <>
            <CopyButton text={agentPrompt} label="Copy daily task for my agent" />
            <p className="text-xs text-slate-500">Contains your private token - don&apos;t share it. Rotating invalidates the old one.</p>
          </>
        ) : null}
        <form action={rotateIngestToken}><button className="btn-ghost">{p.ingest_token ? "Rotate token" : "Create token"}</button></form>
      </div>
    )}
    </div>
  );
}
