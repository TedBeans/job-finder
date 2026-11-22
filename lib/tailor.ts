import type { SupabaseClient } from "@supabase/supabase-js";
import { claude, SMART, textOf, extractJson } from "./claude";
import type { Profile } from "./types";

export type TailorOut = { resume_md: string; cover_letter_md: string; changes: string[] };
export type JobLike = { id: string; title: string; company: string; location: string | null; description: string | null };

/** Rewrite the resume + write a cover letter for one job; saves both and marks the application "ready". */
export async function tailorForJob(db: SupabaseClient, p: Profile, job: JobLike): Promise<TailorOut | null> {
  if (!p.resume_text) return null;
  const res = await claude().messages.create({
    model: SMART(),
    max_tokens: 6000,
    messages: [
      {
        role: "user",
        content: `Tailor this candidate's resume and write a cover letter for the job below.

HARD RULES (truthfulness):
- Use ONLY facts present in the original resume. Never invent employers, titles, dates, degrees, certifications, tools, or metrics.
- You MAY reorder sections/bullets, rewrite wording, tighten, lead with the most relevant achievements, and mirror the job's terminology where it truthfully describes what the candidate did.
- If the job requires something the resume doesn't show, do NOT claim it; list it in "changes" as a gap prefixed "GAP:".
- Keep to one page of content where possible. ATS-friendly plain markdown: # Name, contact line, ## Summary, ## Experience, ## Skills, ## Education.
- Cover letter: 3 short paragraphs, specific to the company/role, no filler, no clichés.

ORIGINAL RESUME:
${p.resume_text.slice(0, 12000)}

CANDIDATE NOTES: ${p.must_haves ?? ""}

JOB: ${job.title} at ${job.company} (${job.location ?? ""})
${(job.description ?? "").slice(0, 6000)}

Reply with ONLY JSON: {"resume_md": string, "cover_letter_md": string, "changes": string[]}  (changes = 4-8 short bullets describing what you changed or emphasized, plus any GAP items).`,
      },
    ],
  });
  const out = extractJson<TailorOut>(textOf(res));
  if (!out?.resume_md) return null;

  await db.from("tailored_resumes").upsert(
    { user_id: p.user_id, job_id: job.id, resume_md: out.resume_md, cover_letter_md: out.cover_letter_md, changes: out.changes ?? [] },
    { onConflict: "user_id,job_id" },
  );
  const { data: app } = await db.from("applications").select("status").eq("user_id", p.user_id).eq("job_id", job.id).maybeSingle();
  if (!app) await db.from("applications").insert({ user_id: p.user_id, job_id: job.id, status: "ready" });
  else if (app.status === "saved")
    await db.from("applications").update({ status: "ready", updated_at: new Date().toISOString() }).eq("user_id", p.user_id).eq("job_id", job.id);
  return out;
}
