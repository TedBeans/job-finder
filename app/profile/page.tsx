import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase";
import { saveProfile } from "../actions";
import { ResumeUpload } from "@/components/ResumeUpload";
import { ScoreSlider } from "@/components/ScoreSlider";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 py-8 md:grid-cols-[240px_1fr] md:gap-10">
      <div><h2 className="text-lg font-bold">{title}</h2><p className="hint mt-1">{hint}</p></div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const { welcome } = await searchParams;
  const { data: p } = await auth.sb.from("profiles").select("*").eq("user_id", auth.user.id).maybeSingle<Profile>();
  const modes = p?.work_modes ?? ["remote", "hybrid", "onsite"];
  const levels = ["entry", "mid", "senior", "lead", "manager", "director", "executive"];

  return (
    <form action={saveProfile} className="max-w-4xl">
      <h1 className="text-3xl font-extrabold">{welcome ? "Let's set up your profile" : "Profile"}</h1>
      <p className="mt-1 text-muted">The more specific you are, the better your matches. Your resume is the source of truth: tailored versions only reuse what&apos;s in it.</p>

      <div className="mt-6 divide-y divide-line border-t border-line">
        <Section title="About you" hint="Shown on your dashboard and used in your tailored resumes.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="full_name">Full name</label><input id="full_name" name="full_name" defaultValue={p?.full_name ?? ""} className="input" required /></div>
            <div><label className="label" htmlFor="headline">Headline</label><input id="headline" name="headline" defaultValue={p?.headline ?? ""} placeholder="Supply chain analyst, 5 years in CPG" className="input" /></div>
          </div>
        </Section>

        <Section title="Resume" hint="Upload a PDF, Word or text file, or paste it in. You can edit the text before saving.">
          <ResumeUpload targetId="resume_text" />
          <textarea id="resume_text" name="resume_text" defaultValue={p?.resume_text ?? ""} rows={14} required aria-label="Resume text" className="input font-mono text-[13px]" />
        </Section>

        <Section title="The job you want" hint="Your job-search task uses all of this to find and score postings.">
          <div><label className="label" htmlFor="target_titles">Job titles</label><input id="target_titles" name="target_titles" defaultValue={p?.target_titles?.join(", ")} placeholder="Operations manager, supply chain analyst" className="input" required /><p className="hint mt-1">Separate with commas.</p></div>
          <div>
            <span className="label">Seniority</span>
            <div className="flex flex-wrap gap-2">{levels.map((l) => (<label key={l} className="chip"><input type="checkbox" name="seniority" value={l} defaultChecked={p?.seniority?.includes(l)} /><span>{l}</span></label>))}</div>
          </div>
          <div>
            <span className="label">Where you&apos;ll work</span>
            <div className="flex flex-wrap gap-2">{["remote", "hybrid", "onsite"].map((m) => (<label key={m} className="chip"><input type="checkbox" name="work_modes" value={m} defaultChecked={modes.includes(m)} /><span>{m}</span></label>))}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="locations">Locations</label><input id="locations" name="locations" defaultValue={p?.locations?.join(", ")} placeholder="St. Louis, MO" className="input" /><p className="hint mt-1">For hybrid and on-site roles.</p></div>
            <div><label className="label" htmlFor="min_salary">Minimum salary per year</label><input id="min_salary" name="min_salary" inputMode="numeric" defaultValue={p?.min_salary ?? ""} placeholder="90000" className="input" /></div>
          </div>
          <div><label className="label" htmlFor="industries">Industries</label><input id="industries" name="industries" defaultValue={p?.industries?.join(", ")} placeholder="CPG, logistics, food and beverage" className="input" /><p className="hint mt-1">Optional.</p></div>
        </Section>

        <Section title="Must-haves and deal-breakers" hint="Deal-breakers pull a job's score down hard. Must-haves push it up.">
          <div><label className="label" htmlFor="must_haves">Must-haves</label><textarea id="must_haves" name="must_haves" defaultValue={p?.must_haves ?? ""} rows={2} placeholder="Strong benefits, a clear growth path, uses NetSuite" className="input" /></div>
          <div><label className="label" htmlFor="deal_breakers">Deal-breakers</label><textarea id="deal_breakers" name="deal_breakers" defaultValue={p?.deal_breakers ?? ""} rows={2} placeholder="More than 25% travel, commission-only pay" className="input" /></div>
        </Section>

        <Section title="Minimum match score" hint="Every job is rated 0 to 100 for how well it fits you. Only jobs at or above this number appear in your matches.">
          <input type="hidden" name="scan_enabled" value="on" />
          <ScoreSlider defaultValue={p?.min_score ?? 70} />
        </Section>
      </div>

      <div className="sticky bottom-0 -mx-5 flex items-center gap-4 border-t border-line bg-canvas/90 px-5 py-4 backdrop-blur lg:-mx-10 lg:px-10">
        <button className="btn">Save profile</button>
        <p className="hint">Next, open Find jobs to get your job-search task.</p>
      </div>
    </form>
  );
}
