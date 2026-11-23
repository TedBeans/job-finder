import type { Profile } from "./types";

const TRUTH = `TRUTHFULNESS RULES for tailored resumes: use ONLY facts in my resume. Never invent employers, titles, dates, degrees, certifications, tools, or metrics. You may reorder, tighten, rewrite wording, lead with the most relevant achievements, and mirror the job's terminology where it truthfully describes what I did. If the job needs something my resume doesn't show, don't claim it - add a line starting "GAP:" to "changes". Resume format: ATS-friendly markdown (# Name, contact line, ## Summary, ## Experience, ## Skills, ## Education), about one page. Cover letter: 3 short paragraphs, specific to the company and role, no filler.`;

const SCHEMA = `{"jobs":[{"title":"","company":"","url":"","location":"","work_mode":"remote|hybrid|onsite","salary_min":null,"salary_max":null,"description":"key responsibilities and requirements, up to ~1500 chars","score":0-100,"reasons":["max 3, under 20 words each"],"concerns":["max 2"],"resume_md":"tailored resume (top matches only)","cover_letter_md":"(top matches only)","changes":["4-8 bullets of what you changed, plus any GAP: lines"]}]}`;

/** The daily task a person gives to their own AI agent (Claude, Muse, ...). */
export function buildAgentPrompt(p: Profile, endpoint: string, topN = 10): string {
  const delivery = p.ingest_token
    ? `DELIVERY: If you can make web requests, POST the JSON to ${endpoint} with header "Authorization: Bearer ${p.ingest_token}" and Content-Type application/json, then reply with a one-line summary. If you cannot make web requests, reply with ONLY the JSON (in one code block) so I can paste it into the app.`
    : `DELIVERY: Reply with ONLY the JSON in one code block so I can paste it into the app.`;
  return `You are my job-search agent. Do this now, and again every morning.

1. Search the web for up to 25 CURRENT, open job postings that fit what I'm looking for. Prefer company career pages and ATS boards (Greenhouse, Lever, Ashby, Workday) over aggregators. Only include postings you actually opened; every URL must be real. Skip anything that violates my deal-breakers. Skip duplicates.
2. Score every posting 0-100 for fit with my resume and preferences (90+ excellent, 70-89 strong, 50-69 stretch, <50 poor). Be blunt and accurate; penalize wrong seniority, unmet must-haves and deal-breakers. If a detail is missing, say so in "concerns" - don't guess.
3. For the ${topN} best postings with score >= ${p.min_score}, also write a tailored resume and cover letter. ${TRUTH}
4. Output JSON in exactly this shape: ${SCHEMA}
${delivery}

WHAT I'M LOOKING FOR
Target titles: ${p.target_titles.join(", ")}
Seniority: ${p.seniority.join(", ") || "any"}
Work arrangement: ${p.work_modes.join(", ")}
Locations: ${p.locations.join(", ") || "any"}
Minimum salary: ${p.min_salary ?? "not specified"}
Industries: ${p.industries.join(", ") || "any"}
Must-haves: ${p.must_haves || "none"}
Deal-breakers: ${p.deal_breakers || "none"}

MY RESUME
${(p.resume_text ?? "").slice(0, 12000)}`;
}

/** One-off: tailor for a specific job already in the dashboard. */
export function buildTailorPrompt(p: Profile, job: { title: string; company: string; url: string; description: string | null }): string {
  return `Tailor my resume and write a cover letter for this job. ${TRUTH}

JOB: ${job.title} at ${job.company}
URL: ${job.url}
${(job.description ?? "").slice(0, 6000)}

Reply with ONLY JSON in one code block: {"jobs":[{"title":${JSON.stringify(job.title)},"company":${JSON.stringify(job.company)},"url":${JSON.stringify(job.url)},"resume_md":"","cover_letter_md":"","changes":[]}]}
${p.ingest_token ? "(If you can make web requests you may POST that JSON instead to the app's /api/ingest with my token; otherwise I'll paste it.)" : ""}

MY RESUME
${(p.resume_text ?? "").slice(0, 12000)}`;
}
