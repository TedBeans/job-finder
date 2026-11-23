import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase";
import { TailorPanel } from "@/components/TailorPanel";
import { StatusForm } from "@/components/StatusForm";
import { setAppStatus } from "@/app/actions";
import { renderMd } from "@/lib/md";
import { Score } from "@/components/Score";
import { CopyButton } from "@/components/CopyButton";
import { ImportBox } from "@/components/ImportBox";
import { aiEnabled } from "@/lib/ai";
import { buildTailorPrompt } from "@/lib/agentPrompt";
import type { Job } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const { sb, user } = auth;
  const { data: job } = await sb.from("jobs").select("*").eq("id", id).single<Job>();
  if (!job) notFound();
  const [{ data: prof }, { data: match }, { data: tailored }, { data: app }] = await Promise.all([
    sb.from("profiles").select("*").eq("user_id", user.id).single(),
    sb.from("matches").select("*").eq("user_id", user.id).eq("job_id", id).maybeSingle(),
    sb.from("tailored_resumes").select("*").eq("user_id", user.id).eq("job_id", id).maybeSingle(),
    sb.from("applications").select("*").eq("user_id", user.id).eq("job_id", id).maybeSingle(),
  ]);

  const musePrompt = tailored
    ? `Help me apply to this job: ${job.title} at ${job.company}.
Application page: ${job.url}

Steps:
1. Open the application page in your browser.
2. Fill in the application using ONLY the information in my resume below. If a question isn't covered by my resume (work authorization, demographics, salary expectations, referral, etc.), stop and ask me instead of guessing.
3. Where the form takes text or an upload, use my tailored resume and cover letter below.
4. Do not create accounts, enter passwords, or enter government ID numbers - tell me and I'll do that part.
5. Before you submit, show me a summary of everything you entered and wait for my approval.

MY TAILORED RESUME:
${tailored.resume_md}

MY COVER LETTER:
${tailored.cover_letter_md ?? ""}`
    : "";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <Link href="/jobs" className="text-sm font-semibold text-muted hover:text-ink">Back to matches</Link>
        <div className="sheet p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{job.title}</h1>
              <p className="mt-1 text-muted">{job.company}{job.location ? `, ${job.location}` : ""}</p>
              {job.work_mode && <span className="mt-2 inline-block rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold capitalize text-brand">{job.work_mode}</span>}
            </div>
            {match && <Score score={match.score} size="lg" className="shrink-0" />}
          </div>
          {match && (match.reasons?.length > 0 || match.concerns?.length > 0) && (
            <div className="mt-5 grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-2">
              <div><h3 className="mb-1 font-bold">Why it fits</h3><ul className="list-disc space-y-1 pl-5">{match.reasons?.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul></div>
              {match.concerns?.length > 0 && <div><h3 className="mb-1 font-bold text-warn">Worth checking</h3><ul className="list-disc space-y-1 pl-5 text-warn">{match.concerns.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul></div>}
            </div>
          )}
          <p className="mt-5 max-h-72 overflow-auto whitespace-pre-wrap border-t border-line pt-5 text-sm leading-relaxed text-ink/80">{job.description ?? "No description saved. Open the posting for details."}</p>
        </div>

        {aiEnabled() ? (
          <TailorPanel jobId={id} resume={tailored?.resume_md} cover={tailored?.cover_letter_md ?? undefined} changes={tailored?.changes ?? undefined} />
        ) : (
          <div className="card space-y-3">
            <h2 className="text-lg font-bold">Tailored resume and cover letter</h2>
            {tailored?.changes && tailored.changes.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink">{tailored.changes.map((c: string, i: number) => <li key={i} className={c.startsWith("GAP:") ? "text-warn" : ""}>{c}</li>)}</ul>
            )}
            {tailored && (
              <div className="flex flex-wrap gap-2">
                <CopyButton text={tailored.resume_md} label="Copy resume" />
                <CopyButton text={tailored.cover_letter_md ?? ""} label="Copy cover letter" />
                <a className="btn-ghost" href={`/jobs/${id}/print?doc=resume`} target="_blank">Print / save PDF - resume</a>
                <a className="btn-ghost" href={`/jobs/${id}/print?doc=cover`} target="_blank">Print / save PDF - cover letter</a>
              </div>
            )}
            <details>
              <summary className="cursor-pointer text-sm font-medium">{tailored ? "Redo with your agent" : "Get a tailored resume from your agent"}</summary>
              <div className="mt-2 space-y-2">
                <CopyButton text={buildTailorPrompt(prof as never, job)} label="Copy tailoring prompt" className="btn" />
                <p className="text-xs text-muted">Paste it into Claude or Muse, then paste the JSON reply here:</p>
                <ImportBox />
              </div>
            </details>
          </div>
        )}

        {tailored && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md rounded-2xl bg-white p-6 text-sm shadow-[0_12px_32px_-16px_rgba(29,27,46,.25)]" dangerouslySetInnerHTML={{ __html: renderMd(tailored.resume_md) }} />
            <div className="md rounded-2xl bg-white p-6 text-sm shadow-[0_12px_32px_-16px_rgba(29,27,46,.25)]" dangerouslySetInnerHTML={{ __html: renderMd(tailored.cover_letter_md ?? "") }} />
          </div>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
        <div className="card space-y-3">
          <h2 className="text-lg font-bold">Apply</h2>
          <p className="hint">Open the posting, use the tailored resume, submit, then mark it applied so it&apos;s tracked.</p>
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn-accent w-full">Open application page</a>
          {tailored ? (
            <CopyButton text={musePrompt} label="Hand to Muse (copy prompt)" className="btn-ghost w-full" />
          ) : (
            <p className="text-xs text-muted">Tailor your resume first to enable &ldquo;Hand to Muse&rdquo;.</p>
          )}
          <form action={setAppStatus}>
            <input type="hidden" name="jobId" value={id} />
            <input type="hidden" name="status" value="applied" />
            <button className="btn-ghost w-full" disabled={app?.status === "applied"}>I applied</button>
          </form>
        </div>
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Status</h2>
          <StatusForm jobId={id} status={app?.status ?? "saved"} notes={app?.notes} followUp={app?.follow_up_at} />
        </div>
      </aside>
    </div>
  );
}
