import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase";
import { claude, SMART, textOf, extractJson } from "@/lib/claude";
import type { Job, Profile } from "@/lib/types";

export const maxDuration = 120;

type Out = { resume_md: string; cover_letter_md: string; changes: string[] };

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { jobId } = (await req.json()) as { jobId: string };
  const { sb, user } = auth;

  const [{ data: p }, { data: job }] = await Promise.all([
    sb.from("profiles").select("*").eq("user_id", user.id).single<Profile>(),
    sb.from("jobs").select("*").eq("id", jobId).single<Job>(),
  ]);
  if (!p?.resume_text || !job) return NextResponse.json({ error: "Missing resume or job" }, { status: 400 });

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
  const out = extractJson<Out>(textOf(res));
  if (!out?.resume_md) return NextResponse.json({ error: "Model returned unusable output, try again" }, { status: 502 });

  await sb.from("tailored_resumes").upsert(
    { user_id: user.id, job_id: jobId, resume_md: out.resume_md, cover_letter_md: out.cover_letter_md, changes: out.changes ?? [] },
    { onConflict: "user_id,job_id" },
  );
  // Move to "ready" without overwriting a later stage.
  const { data: app } = await sb.from("applications").select("status").eq("user_id", user.id).eq("job_id", jobId).maybeSingle();
  if (!app) await sb.from("applications").insert({ user_id: user.id, job_id: jobId, status: "ready" });
  else if (app.status === "saved") await sb.from("applications").update({ status: "ready", updated_at: new Date().toISOString() }).eq("user_id", user.id).eq("job_id", jobId);

  return NextResponse.json(out);
}
