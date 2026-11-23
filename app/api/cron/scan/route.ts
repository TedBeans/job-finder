import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { scanUser } from "@/lib/scan";
import { aiEnabled } from "@/lib/ai";
import type { Profile } from "@/lib/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!aiEnabled()) return NextResponse.json({ ok: true, skipped: "No ANTHROPIC_API_KEY; agents push jobs via /api/ingest" });
  const deadline = Date.now() + 270_000;
  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("*")
    .eq("scan_enabled", true)
    .not("resume_text", "is", null)
    .order("last_scan_at", { ascending: true, nullsFirst: true });
  const results: Record<string, unknown> = {};
  // Oldest-scanned first, so if time runs out the same friend isn't always skipped.
  for (const p of (data ?? []) as Profile[]) {
    if (Date.now() > deadline - 30_000) break;
    results[p.email ?? p.user_id] = await scanUser(p, Math.min(deadline, Date.now() + 110_000)); // ~2 min per friend
  }
  return NextResponse.json({ ok: true, results });
}
