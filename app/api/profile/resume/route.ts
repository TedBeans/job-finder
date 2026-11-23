import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase";
import { extractResumeText } from "@/lib/resumeText";

export const maxDuration = 30;

/** Always answers with JSON: { text } | { needsOcr: true } | { error }. Nothing is stored here. */
export async function POST(req: Request) {
  try {
    if (!(await requireUser())) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
    if (file.size > 8_000_000) return NextResponse.json({ error: "That file is over 8 MB." }, { status: 413 });
    return NextResponse.json(await extractResumeText(file.name, Buffer.from(await file.arrayBuffer())));
  } catch (e) {
    return NextResponse.json({ error: `Couldn't read that file${e instanceof Error ? `: ${e.message}` : "."}` }, { status: 500 });
  }
}
