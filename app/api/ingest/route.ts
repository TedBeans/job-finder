import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { processJobs } from "@/lib/scan";
import type { Profile, RawJob } from "@/lib/types";

export const maxDuration = 300;

const Job = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  url: z.string().url(),
  location: z.string().nullish(),
  work_mode: z.enum(["remote", "hybrid", "onsite"]).nullish(),
  salary_min: z.number().nullish(),
  salary_max: z.number().nullish(),
  description: z.string().nullish(),
  posted_at: z.string().nullish(),
});
const Body = z.object({ jobs: z.array(Job).min(1).max(50) });

/** POST { jobs: [...] } with "Authorization: Bearer <your ingest token>". Jobs are scored, matched and tailored like a normal scan. */
export async function POST(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (token.length < 24) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: p } = await supabaseAdmin().from("profiles").select("*").eq("ingest_token", token).maybeSingle<Profile>();
  if (!p) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!p.resume_text) return NextResponse.json({ error: "Profile has no resume yet" }, { status: 400 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad body", details: parsed.error.issues.slice(0, 5) }, { status: 400 });

  const raw: RawJob[] = parsed.data.jobs.map((j) => ({
    source: "ingest",
    external_id: j.url,
    title: j.title,
    company: j.company,
    location: j.location ?? null,
    work_mode: j.work_mode ?? null,
    salary_min: j.salary_min ?? null,
    salary_max: j.salary_max ?? null,
    url: j.url,
    description: j.description?.slice(0, 6000) ?? null,
    posted_at: j.posted_at ?? null,
  }));
  return NextResponse.json({ ok: true, ...(await processJobs(p, raw, Date.now() + 270_000)) });
}
