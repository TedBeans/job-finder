import { NextResponse } from "next/server";
import { requireUser, supabaseAdmin } from "@/lib/supabase";
import { scanUser } from "@/lib/scan";
import type { Profile } from "@/lib/types";

export const maxDuration = 300;

export async function POST() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await supabaseAdmin().from("profiles").select("*").eq("user_id", auth.user.id).single();
  if (!data) return NextResponse.json({ error: "Create your profile first" }, { status: 400 });
  return NextResponse.json(await scanUser(data as Profile));
}
