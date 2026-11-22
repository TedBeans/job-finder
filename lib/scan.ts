import { supabaseAdmin } from "./supabase";
import { claude, FAST, textOf, extractJson } from "./claude";
import { fetchMuse } from "./muse";
import { searchJobsWithClaude } from "./websearch";
import { tailorForJob } from "./tailor";
import type { Profile, RawJob } from "./types";

const key = (company: string, title: string) =>
  `${company.toLowerCase().replace(/[^a-z0-9]/g, "")}|${title.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

function passesHardFilters(j: RawJob, p: Profile): boolean {
  if (j.work_mode && p.work_modes.length && !p.work_modes.includes(j.work_mode)) return false;
  if (p.min_salary && j.salary_max && j.salary_max < p.min_salary) return false;
  return true;
}

type Score = { i: number; score: number; reasons: string[]; concerns: string[] };

async function scoreBatch(p: Profile, jobs: { id: string; j: RawJob }[]): Promise<Map<string, Score>> {
  const list = jobs
    .map(
      ({ j }, i) =>
        `#${i} ${j.title} @ ${j.company} | ${j.location ?? "n/a"} | mode:${j.work_mode ?? "unknown"} | salary:${j.salary_min ?? "?"}-${j.salary_max ?? "?"}\n${(j.description ?? "").slice(0, 1500)}`,
    )
    .join("\n\n---\n\n");
  const res = await claude().messages.create({
    model: FAST(),
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `You are a blunt, accurate job-matching assistant. Score each job 0-100 for fit with this candidate. 90+ = excellent fit on skills, level, and preferences; 70-89 = strong; 50-69 = stretch/partial; <50 = poor. Penalize violated deal-breakers, wrong seniority, and unmet must-haves heavily. Do not invent facts about the job; if info is missing, say so in concerns.

RESUME:
${(p.resume_text ?? "").slice(0, 8000)}

PREFERENCES:
Target titles: ${p.target_titles.join(", ")}
Seniority: ${p.seniority.join(", ")}
Locations: ${p.locations.join(", ")}
Work modes: ${p.work_modes.join(", ")}
Min salary: ${p.min_salary ?? "n/a"}
Industries: ${p.industries.join(", ")}
Must-haves: ${p.must_haves ?? ""}
Deal-breakers: ${p.deal_breakers ?? ""}

JOBS:
${list}

Reply with ONLY a JSON array: [{"i":0,"score":85,"reasons":["...","..."],"concerns":["..."]}] (max 3 reasons, 2 concerns, each under 20 words).`,
      },
    ],
  });
  const arr = extractJson<Score[]>(textOf(res)) ?? [];
  const out = new Map<string, Score>();
  for (const s of arr) if (jobs[s.i]) out.set(jobs[s.i].id, s);
  return out;
}

type NewMatch = { id: string; j: RawJob; score: number };

/** Shared by the daily scan and the /api/ingest endpoint: dedupe, filter, score, store, then auto-tailor the best. */
export async function processJobs(p: Profile, raw: RawJob[], deadlineMs: number) {
  const db = supabaseAdmin();
  // dedupe within batch
  const seen = new Set<string>();
  const unique = raw.filter((j) => {
    const k = key(j.company, j.title);
    if (seen.has(k)) return false;
    seen.add(k);
    return passesHardFilters(j, p);
  });

  // reuse existing job rows (same source id or same company+title in last 60 days)
  const since = new Date(Date.now() - 60 * 864e5).toISOString();
  const { data: existing } = await db.from("jobs").select("id, source, external_id, company, title").gte("found_at", since);
  const byKey = new Map((existing ?? []).map((e) => [key(e.company, e.title), e.id as string]));
  const bySrc = new Map((existing ?? []).map((e) => [`${e.source}:${e.external_id}`, e.id as string]));

  const withIds: { id: string; j: RawJob }[] = [];
  const toInsert: RawJob[] = [];
  for (const j of unique) {
    const id = bySrc.get(`${j.source}:${j.external_id}`) ?? byKey.get(key(j.company, j.title));
    if (id) withIds.push({ id, j });
    else toInsert.push(j);
  }
  if (toInsert.length) {
    const { data: ins, error: e } = await db.from("jobs").upsert(toInsert, { onConflict: "source,external_id" }).select("id, source, external_id");
    if (e) throw e;
    const m = new Map((ins ?? []).map((r) => [`${r.source}:${r.external_id}`, r.id as string]));
    for (const j of toInsert) {
      const id = m.get(`${j.source}:${j.external_id}`);
      if (id) withIds.push({ id, j });
    }
  }

  // skip jobs this user has already been shown
  const { data: seenRows } = await db.from("matches").select("job_id").eq("user_id", p.user_id);
  const shown = new Set((seenRows ?? []).map((r) => r.job_id));
  const fresh = withIds.filter((x) => !shown.has(x.id));

  const newMatches: NewMatch[] = [];
  for (let i = 0; i < fresh.length && Date.now() < deadlineMs; i += 8) {
    const batch = fresh.slice(i, i + 8);
    const scores = await scoreBatch(p, batch);
    const rows = batch
      .filter((b) => scores.has(b.id))
      .map((b) => {
        const s = scores.get(b.id)!;
        const score = Math.max(0, Math.min(100, Math.round(s.score)));
        return {
          user_id: p.user_id,
          job_id: b.id,
          score,
          reasons: s.reasons ?? [],
          concerns: s.concerns ?? [],
          // below threshold: record it so we don't rescore, but keep it out of the feed
          status: score >= p.min_score ? "new" : "dismissed",
          _b: b,
        };
      });
    if (rows.length) {
      await db.from("matches").upsert(rows.map(({ _b, ...r }) => r), { onConflict: "user_id,job_id", ignoreDuplicates: true });
      for (const r of rows) if (r.status === "new") newMatches.push({ id: r._b.id, j: r._b.j, score: r.score });
    }
  }

  // Auto-tailor the best new matches so they're ready to apply to when the user opens the dashboard.
  const max = parseInt(process.env.AUTO_TAILOR_MAX ?? "5", 10);
  let tailored = 0;
  for (const m of newMatches.sort((a, b) => b.score - a.score).slice(0, max)) {
    if (Date.now() > deadlineMs - 40_000) break;
    try {
      if (await tailorForJob(db, p, { id: m.id, title: m.j.title, company: m.j.company, location: m.j.location, description: m.j.description })) tailored++;
    } catch {
      /* the user can still tailor manually from the job page */
    }
  }
  return { candidates: fresh.length, matched: newMatches.length, tailored };
}

export async function scanUser(p: Profile, deadlineMs = Date.now() + 240_000) {
  const db = supabaseAdmin();
  const { data: run } = await db.from("scan_runs").insert({ user_id: p.user_id }).select("id").single();
  let result = { candidates: 0, matched: 0, tailored: 0 };
  let error: string | null = null;
  try {
    if (!p.resume_text) throw new Error("No resume on file");
    const settled = await Promise.allSettled([fetchMuse(p), searchJobsWithClaude(p)]);
    const raw: RawJob[] = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
    const errs = settled.filter((s) => s.status === "rejected").map((s) => String((s as PromiseRejectedResult).reason));
    if (errs.length === settled.length) throw new Error(errs.join(" | "));
    result = await processJobs(p, raw, deadlineMs);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  await db.from("profiles").update({ last_scan_at: new Date().toISOString() }).eq("user_id", p.user_id);
  if (run) await db.from("scan_runs").update({ finished_at: new Date().toISOString(), candidates: result.candidates, matched: result.matched, error }).eq("id", run.id);
  return { ...result, error };
}
