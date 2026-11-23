import { z } from "zod";
import { supabaseAdmin } from "./supabase";
import { aiEnabled } from "./ai";
import { extractJson } from "./claude";
import { processJobs, upsertJobs } from "./scan";
import type { Profile, RawJob } from "./types";

export const IngestJob = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  url: z.string().url(),
  location: z.string().nullish(),
  work_mode: z.enum(["remote", "hybrid", "onsite"]).nullish(),
  salary_min: z.number().nullish(),
  salary_max: z.number().nullish(),
  description: z.string().nullish(),
  posted_at: z.string().nullish(),
  // Optional: finished work from the agent
  score: z.number().min(0).max(100).nullish(),
  reasons: z.array(z.string()).nullish(),
  concerns: z.array(z.string()).nullish(),
  resume_md: z.string().nullish(),
  cover_letter_md: z.string().nullish(),
  changes: z.array(z.string()).nullish(),
});
type IngestJobT = z.infer<typeof IngestJob>;

export function parseIngest(input: unknown): { jobs: IngestJobT[] } | { error: string } {
  const body = Array.isArray(input) ? { jobs: input } : input;
  const r = z.object({ jobs: z.array(IngestJob).min(1).max(50) }).safeParse(body);
  if (!r.success) return { error: `Couldn't read that: ${r.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}` };
  return r.data;
}

/** Accepts pasted agent output (may include prose / code fences). */
export function parseIngestText(text: string) {
  const j = extractJson<unknown>(text);
  return j ? parseIngest(j) : { error: "No JSON found in what you pasted." };
}

export async function ingestAgentJobs(p: Profile, jobs: IngestJobT[], deadlineMs = Date.now() + 240_000) {
  const db = supabaseAdmin();
  const finished = jobs.filter((j) => j.score != null || j.resume_md);
  const unscored = jobs.filter((j) => j.score == null && !j.resume_md);

  const toRaw = (j: IngestJobT): RawJob => ({
    source: "ingest", external_id: j.url, title: j.title, company: j.company, location: j.location ?? null,
    work_mode: j.work_mode ?? null, salary_min: j.salary_min ?? null, salary_max: j.salary_max ?? null,
    url: j.url, description: j.description?.slice(0, 6000) ?? null, posted_at: j.posted_at ?? null,
  });

  let matched = 0, tailored = 0, skipped = 0;
  if (finished.length) {
    const raws = finished.map(toRaw);
    const src = new Map(raws.map((r, i) => [r, finished[i]]));
    const withIds = await upsertJobs(p, raws, false);
    const ids = withIds.map((w) => w.id);
    const { data: have } = await db.from("matches").select("job_id").eq("user_id", p.user_id).in("job_id", ids);
    const haveSet = new Set((have ?? []).map((h) => h.job_id));
    for (const { id, j } of withIds) {
      const a = src.get(j)!;
      const score = Math.round(a.score ?? p.min_score);
      const fields = { score, reasons: a.reasons ?? [], concerns: a.concerns ?? [] };
      if (haveSet.has(id)) {
        if (a.score != null) await db.from("matches").update(fields).eq("user_id", p.user_id).eq("job_id", id);
      } else {
        await db.from("matches").insert({ user_id: p.user_id, job_id: id, ...fields, status: score >= p.min_score ? "new" : "dismissed" });
        if (score >= p.min_score) matched++;
      }
      if (a.resume_md) {
        await db.from("tailored_resumes").upsert(
          { user_id: p.user_id, job_id: id, resume_md: a.resume_md, cover_letter_md: a.cover_letter_md ?? null, changes: a.changes ?? [] },
          { onConflict: "user_id,job_id" },
        );
        const { data: app } = await db.from("applications").select("status").eq("user_id", p.user_id).eq("job_id", id).maybeSingle();
        if (!app) await db.from("applications").insert({ user_id: p.user_id, job_id: id, status: "ready" });
        else if (app.status === "saved") await db.from("applications").update({ status: "ready", updated_at: new Date().toISOString() }).eq("user_id", p.user_id).eq("job_id", id);
        tailored++;
      }
    }
  }
  if (unscored.length) {
    if (aiEnabled()) {
      const r = await processJobs(p, unscored.map(toRaw), deadlineMs);
      matched += r.matched;
      tailored += r.tailored;
    } else skipped = unscored.length;
  }
  return { received: jobs.length, matched, tailored, skipped_without_score: skipped };
}
