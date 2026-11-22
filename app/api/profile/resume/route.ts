import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { requireUser } from "@/lib/supabase";
import { claude, FAST, textOf } from "@/lib/claude";

export const maxDuration = 60;

/** Turn an uploaded resume (pdf/docx/txt/md) into plain text. Nothing is stored here. */
export async function POST(req: Request) {
  if (!(await requireUser())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > 5_000_000) return NextResponse.json({ error: "File too large (5MB max)" }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  let text = "";
  if (name.endsWith(".pdf")) {
    const res = await claude().messages.create({
      model: FAST(),
      max_tokens: 6000,
      messages: [
        {
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: buf.toString("base64") } },
            { type: "text", text: "Transcribe this resume to clean markdown. Preserve every fact exactly; do not add, summarize, or omit anything. Output only the resume." },
          ],
        },
      ],
    });
    text = textOf(res);
  } else if (name.endsWith(".docx")) {
    text = (await mammoth.extractRawText({ buffer: buf })).value;
  } else if (name.endsWith(".txt") || name.endsWith(".md")) {
    text = buf.toString("utf8");
  } else {
    return NextResponse.json({ error: "Use PDF, DOCX, TXT or MD" }, { status: 415 });
  }
  return NextResponse.json({ text: text.trim() });
}
