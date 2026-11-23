import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase";
import { tailorForJob } from "@/lib/tailor";
import { aiEnabled } from "@/lib/ai";
import type { Job, Profile } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  if (!aiEnabled()) return NextResponse.json({ error: "Server-side tailoring is off." }, { status: 400 });
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { jobId } = (await req.json()) as { jobId: string };
  const { sb, user } = auth;
  const [{ data: p }, { data: job }] = await Promise.all([
    sb.from("profiles").select("*").eq("user_id", user.id).single<Profile>(),
    sb.from("jobs").select("*").eq("id", jobId).single<Job>(),
  ]);
  if (!p?.resume_text || !job) return NextResponse.json({ error: "Missing resume or job" }, { status: 400 });
  const out = await tailorForJob(sb, p, job);
  if (!out) return NextResponse.json({ error: "Model returned unusable output, try again" }, { status: 502 });
  return NextResponse.json(out);
}
