import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase";
import { TailorPanel } from "@/components/TailorPanel";
import { StatusForm } from "@/components/StatusForm";
import { setAppStatus } from "@/app/actions";
import { renderMd } from "@/lib/md";
import { CopyButton } from "@/components/CopyButton";
import type { Job } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const { sb, user } = auth;
  const { data: job } = await sb.from("jobs").select("*").eq("id", id).single<Job>();
  if (!job) notFound();
  const [{ data: match }, { data: tailored }, { data: app }] = await Promise.all([
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
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Link href="/jobs" className="text-sm text-slate-500">&larr; Matches</Link>
        <div className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">{job.title}</h1>
              <p className="text-slate-600">{job.company} - {job.location ?? "n/a"} {job.work_mode && `- ${job.work_mode}`}</p>
            </div>
            {match && <div className="rounded-lg bg-slate-900 px-3 py-2 text-xl font-bold text-white">{match.score}</div>}
          </div>
          {match && (
            <div className="mt-3 text-sm">
              <ul className="list-disc pl-5">{match.reasons?.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
              <ul className="mt-1 list-disc pl-5 text-amber-700">{match.concerns?.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}
          <p className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap text-sm text-slate-700">{job.description ?? "No description captured - open the posting."}</p>
        </div>

        <TailorPanel jobId={id} resume={tailored?.resume_md} cover={tailored?.cover_letter_md ?? undefined} changes={tailored?.changes ?? undefined} />

        {tailored && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card md text-sm" dangerouslySetInnerHTML={{ __html: renderMd(tailored.resume_md) }} />
            <div className="card md text-sm" dangerouslySetInnerHTML={{ __html: renderMd(tailored.cover_letter_md ?? "") }} />
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="card space-y-3">
          <h2 className="font-semibold">Apply</h2>
          <p className="text-sm text-slate-600">Open the posting, paste in the tailored resume, submit, then mark it applied so it&apos;s tracked.</p>
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn w-full">Open application page</a>
          {tailored ? (
            <CopyButton text={musePrompt} label="Hand to Muse (copy prompt)" className="btn-ghost w-full" />
          ) : (
            <p className="text-xs text-slate-500">Tailor your resume first to enable &ldquo;Hand to Muse&rdquo;.</p>
          )}
          <form action={setAppStatus}>
            <input type="hidden" name="jobId" value={id} />
            <input type="hidden" name="status" value="applied" />
            <button className="btn-ghost w-full" disabled={app?.status === "applied"}>I applied</button>
          </form>
        </div>
        <div className="card">
          <h2 className="mb-2 font-semibold">Status</h2>
          <StatusForm jobId={id} status={app?.status ?? "saved"} notes={app?.notes} followUp={app?.follow_up_at} />
        </div>
      </aside>
    </div>
  );
}
