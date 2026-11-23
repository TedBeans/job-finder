# Job Finder

**No-AI-cost mode (default):** the app has no AI key. Each person copies a ready-made job-search task from **Find jobs** into their own Claude or Muse (on their own plan). The agent searches, scores, and writes tailored resumes, then the results reach the dashboard automatically (`POST /api/ingest`, if the agent can make web requests) or by pasting the JSON reply into the Import box. Set `ANTHROPIC_API_KEY` only if you later want the server to scan/tailor on its own (daily Vercel cron + "Scan now"); everything below about server-side scanning applies only then.

Daily job scan -> match scoring -> resume tailoring -> application tracking, for you and your friends.

**Stack:** Next.js 16 (App Router) on Vercel, Supabase (auth + Postgres), Claude API, The Muse public jobs API.

## How it works
1. **Profile**: each user uploads/pastes a resume and sets titles, seniority, locations, remote/hybrid/on-site, min salary, must-haves, deal-breakers.
2. **Daily scan** (`/api/cron/scan`, Vercel Cron, 12:00 UTC): for each user, pulls jobs from
   - **The Muse** (categories are chosen by Claude from the profile's target titles), and
   - **Claude + web search** (one search per target title, up to 4 titles; finds fresh postings on company career pages / Greenhouse / Lever / Ashby).
   Jobs are de-duplicated, hard-filtered (work mode, salary when known), then scored 0-100 by Claude against the resume + preferences. Matches at or above the user's threshold show up in **Matches**.
3. **Tailor**: the best new matches (up to `AUTO_TAILOR_MAX`, default 12, per scan) are tailored automatically so they show up under **Ready to apply** on the dashboard. Any other job can be tailored with one click. It rewrites the resume + writes a cover letter for a specific job. Claude is instructed to use only facts from the original resume (no invented employers, titles, metrics) and to list unmet requirements as `GAP:` items. Export via Print -> Save as PDF.
3b. **Guided questions**: after uploading a resume, a short step-by-step questionnaire (/questionnaire: roles, workplaces, things to avoid, schedule, location, pay, credentials, priorities) fills in the profile. No AI needed. Run `alter table profiles add column if not exists preferences jsonb;` once so answers can be reopened and edited.
4. **Apply + track**: "Open application page" -> submit -> "I applied". Or press **Hand to Muse**: it copies a prompt (job link + tailored resume + cover letter + guardrails) that you paste into your Muse agent; Muse fills the form and waits for your approval before submitting. Kanban board: saved, ready, applied, screening, interview, offer, rejected, withdrawn, with notes and follow-up dates (overdue ones highlight).

> Applications are submitted by the user, not auto-submitted. Most ATS forms have CAPTCHAs, account walls and ToS that prohibit bots, and a wrong auto-submission is expensive. The app does everything up to the click.

## Bring your own agent (optional)
`POST /api/ingest` with `Authorization: Bearer <token>` and `{"jobs":[{title, company, url, location?, work_mode?, salary_min?, salary_max?, description?}]}` (max 50). Jobs go through the same dedupe, scoring, matching and auto-tailoring as the daily scan. Create a token on the Profile page, which also gives you a copy-paste daily task for Muse or Claude. Whether a given consumer agent can make HTTP requests is untested.

## Setup
1. Create a Supabase project. Run `supabase/schema.sql` in the SQL editor. In Auth settings, add your Vercel URL (and `http://localhost:3000`) to the redirect URLs: `<url>/auth/callback`.
2. Copy `.env.example` to `.env.local` and fill it in (Supabase URL/anon/service-role keys, `ANTHROPIC_API_KEY`, `CRON_SECRET` = any long random string, optional `MUSE_API_KEY`, optional `ALLOWED_EMAILS` invite list).
3. `npm install && npm run dev`

## Deploy to Vercel
- Import `TedBeans/job-finder`, add the same env vars, deploy. `vercel.json` registers the daily cron; Vercel sends `Authorization: Bearer $CRON_SECRET` automatically.
- Hobby plan crons run once/day (matches the schedule). The cron function is limited to 300s, so it scans users oldest-scan-first within that budget. For more than ~5-8 friends, move to a queue (Vercel Queues / Inngest) or one cron per user.
- Set `ALLOWED_EMAILS` so only invited friends can sign up (each scan spends your Anthropic credits).

## Cost notes
Scoring uses the fast model (`CLAUDE_MODEL_FAST`); web search and tailoring use `CLAUDE_MODEL_SMART`. Override both in env.

## Not yet verified
Muse here means The Muse job board API (themuse.com), not Meta's Muse agent. Its response shape and category names were written from memory (docs weren't reachable during the build) - hit `/api/scan` once with a real key and check the Muse results. Nothing has been tested against live Supabase/Anthropic yet.
