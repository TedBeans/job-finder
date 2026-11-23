import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export type ResumeResult = { text: string } | { needsOcr: true } | { error: string };

/** Pull plain text out of a resume file without any AI. Image-only PDFs are reported as needsOcr. */
export async function extractResumeText(name: string, buf: Buffer): Promise<ResumeResult> {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) {
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    return text.replace(/\s+\n/g, "\n").trim().length < 80 ? { needsOcr: true } : { text: text.trim() };
  }
  if (n.endsWith(".docx")) {
    const text = (await mammoth.extractRawText({ buffer: buf })).value.trim();
    return text.length < 40 ? { error: "That Word file looks empty." } : { text };
  }
  if (n.endsWith(".txt") || n.endsWith(".md")) return { text: buf.toString("utf8").trim() };
  return { error: "Use a PDF, Word (.docx) or text file, or a photo (.png or .jpg)." };
}
