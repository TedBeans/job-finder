"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser, supabaseServer } from "@/lib/supabase";
import { claude, FAST, textOf, extractJson } from "@/lib/claude";
import { MUSE_CATEGORIES } from "@/lib/muse";
import { APP_STATUSES } from "@/lib/types";

export async function signIn(_: unknown, fd: FormData) {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const allowed = (process.env.ALLOWED_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (allowed.length && !allowed.includes(email)) return { error: "That email isn't on the invite list." };
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${origin}/auth/callback` } });
  return error ? { error: error.message } : { sent: true };
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/login");
}

const list = (v: FormDataEntryValue | null) =>
  String(v ?? "").split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

export async function saveProfile(fd: FormData) {
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const titles = list(fd.get("target_titles"));
  const industries = list(fd.get("industries"));

  let muse_categories: string[] = [];
  if (titles.length && process.env.ANTHROPIC_API_KEY) {
    try {
      const res = await claude().messages.create({
        model: FAST(),
        max_tokens: 300,
        messages: [{ role: "user", content: `Pick the 1-3 best matching categories from this list for someone targeting these job titles: ${titles.join(", ")}.\nList: ${MUSE_CATEGORIES.join(" | ")}\nReply ONLY with a JSON array of exact category strings.` }],
      });
      muse_categories = (extractJson<string[]>(textOf(res)) ?? []).filter((c) => MUSE_CATEGORIES.includes(c));
    } catch {
      /* non-fatal: Claude web search still works without Muse categories */
    }
  }

  const salary = parseInt(String(fd.get("min_salary") ?? "").replace(/[^0-9]/g, ""), 10);
  await auth.sb.from("profiles").upsert({
    user_id: auth.user.id,
    email: auth.user.email,
    full_name: String(fd.get("full_name") ?? ""),
    headline: String(fd.get("headline") ?? ""),
    resume_text: String(fd.get("resume_text") ?? ""),
    target_titles: titles,
    locations: list(fd.get("locations")),
    work_modes: fd.getAll("work_modes").map(String),
    min_salary: Number.isFinite(salary) ? salary : null,
    seniority: fd.getAll("seniority").map(String),
    industries,
    must_haves: String(fd.get("must_haves") ?? ""),
    deal_breakers: String(fd.get("deal_breakers") ?? ""),
    min_score: Math.min(95, Math.max(30, parseInt(String(fd.get("min_score") ?? "70"), 10) || 70)),
    scan_enabled: fd.get("scan_enabled") === "on",
    muse_categories,
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/", "layout");
  redirect(titles.length ? "/?saved=1" : "/questionnaire");
}

export async function setMatchStatus(jobId: string, status: "new" | "saved" | "dismissed") {
  const auth = await requireUser();
  if (!auth) return;
  await auth.sb.from("matches").update({ status }).eq("user_id", auth.user.id).eq("job_id", jobId);
  if (status === "saved") {
    await auth.sb.from("applications").upsert({ user_id: auth.user.id, job_id: jobId, status: "saved" }, { onConflict: "user_id,job_id", ignoreDuplicates: true });
  }
  revalidatePath("/jobs");
  revalidatePath("/");
}

export async function setAppStatus(fd: FormData) {
  const auth = await requireUser();
  if (!auth) return;
  const jobId = String(fd.get("jobId"));
  const status = String(fd.get("status"));
  if (!(APP_STATUSES as readonly string[]).includes(status)) return;
  const patch: Record<string, unknown> = { user_id: auth.user.id, job_id: jobId, status, updated_at: new Date().toISOString() };
  if (status === "applied") patch.applied_at = new Date().toISOString();
  if (fd.has("notes")) patch.notes = String(fd.get("notes"));
  const fu = String(fd.get("follow_up_at") ?? "");
  if (fd.has("follow_up_at")) patch.follow_up_at = fu || null;
  await auth.sb.from("applications").upsert(patch, { onConflict: "user_id,job_id" });
  revalidatePath("/applications");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/");
}

export async function rotateIngestToken() {
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const { randomBytes } = await import("node:crypto");
  await auth.sb.from("profiles").update({ ingest_token: randomBytes(24).toString("hex") }).eq("user_id", auth.user.id);
  revalidatePath("/profile");
}

export async function importFromAgent(_: unknown, fd: FormData) {
  const auth = await requireUser();
  if (!auth) return { error: "Please sign in again." };
  const { parseIngestText, ingestAgentJobs } = await import("@/lib/ingest");
  const parsed = parseIngestText(String(fd.get("payload") ?? ""));
  if ("error" in parsed) return { error: parsed.error };
  const { data: p } = await auth.sb.from("profiles").select("*").eq("user_id", auth.user.id).single();
  if (!p) return { error: "Set up your profile first." };
  const r = await ingestAgentJobs(p, parsed.jobs);
  revalidatePath("/", "layout");
  return { ok: `Imported ${r.received} jobs: ${r.matched} new matches, ${r.tailored} tailored resumes.` };
}

export async function saveQuestionnaire(answers: import("@/lib/questionnaire").Answers) {
  const auth = await requireUser();
  if (!auth) return { error: "Please sign in again." };
  const { compose } = await import("@/lib/questionnaire");
  const c = compose(answers);
  if (!c.target_titles.length) return { error: "Add at least one job title you'd like." };
  const base = { user_id: auth.user.id, email: auth.user.email, ...c, updated_at: new Date().toISOString() };
  let { error } = await auth.sb.from("profiles").upsert({ ...base, preferences: answers });
  // If the optional "preferences" column hasn't been added yet, still save everything else.
  if (error && /preferences/i.test(error.message)) ({ error } = await auth.sb.from("profiles").upsert(base));
  if (error) return { error: "Couldn't save. Please try again." };
  revalidatePath("/", "layout");
  return { ok: true };
}
