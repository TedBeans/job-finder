import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ingestAgentJobs, parseIngest } from "@/lib/ingest";
import type { Profile } from "@/lib/types";

export const maxDuration = 300;

/** POST { jobs: [...] } with "Authorization: Bearer <your token>". Each job may include score/reasons/concerns and a tailored resume + cover letter. */
export async function POST(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (token.length < 24) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: p } = await supabaseAdmin().from("profiles").select("*").eq("ingest_token", token).maybeSingle<Profile>();
  if (!p) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = parseIngest(await req.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json(parsed, { status: 400 });
  return NextResponse.json({ ok: true, ...(await ingestAgentJobs(p, parsed.jobs)) });
}
