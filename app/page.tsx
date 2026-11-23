import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase";
import { ScanButton } from "@/components/ScanButton";
import { Score } from "@/components/Score";
import { JobRow } from "@/components/JobRow";
import { aiEnabled } from "@/lib/ai";
import { STATUS_DOT } from "@/lib/status";
import { APP_STATUSES, type Job } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const { sb, user } = auth;
  const { data: profile } = await sb.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!profile?.resume_text) redirect("/profile?welcome=1");
  if (!profile.target_titles?.length) redirect("/questionnaire");

  const [{ data: top }, { data: apps }, { data: ready }] = await Promise.all([
    sb.from("matches").select("score, reasons, job:jobs(*)").eq("user_id", user.id).eq("status", "new").order("score", { ascending: false }).limit(6),
    sb.from("applications").select("status").eq("user_id", user.id),
    sb.from("applications").select("job:jobs(*)").eq("user_id", user.id).eq("status", "ready").order("updated_at", { ascending: false }).limit(8),
  ]);
  const counts = Object.fromEntries(APP_STATUSES.map((s) => [s, (apps ?? []).filter((a) => a.status === s).length]));
  const max = Math.max(1, ...Object.values(counts));
  const featured = top?.[0];
  const fj = featured?.job as unknown as Job | undefined;
  const rest = (top ?? []).slice(1);
  const first = profile.full_name?.split(" ")[0];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">{first ? `Welcome back, ${first}` : "Welcome back"}</h1>
          <p className="mt-1 text-muted">{profile.last_scan_at ? `Last job import ${new Date(profile.last_scan_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}.` : "No jobs imported yet."}</p>
        </div>
        {aiEnabled() ? <ScanButton /> : <Link href="/agent" className="btn">Find jobs</Link>}
      </header>

      {fj && featured ? (
        <section className="relative overflow-hidden rounded-[28px] bg-brand p-7 text-white shadow-[0_20px_50px_-20px_rgba(91,61,245,.6)] sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
            <div className="shrink-0 text-sun"><Score score={featured.score} size="xl" plain /></div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/75">Your best match right now</p>
              <h2 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">{fj.title}</h2>
              <p className="mt-1 text-white/85">{fj.company}{fj.location ? `, ${fj.location}` : ""}</p>
              {featured.reasons?.length > 0 && (
                <ul className="mt-4 space-y-1 text-sm text-white/90">{featured.reasons.slice(0, 2).map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/jobs/${fj.id}`} className="btn-accent">Review and apply</Link>
                <Link href="/jobs" className="inline-flex items-center rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">All matches</Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="sheet p-8 text-center sm:p-12">
          <h2 className="text-2xl font-extrabold">No matches yet</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">Run your job-search task to bring in jobs. Each one is scored against your resume, and the best get a tailored resume.</p>
          <Link href="/agent" className="btn mt-6">Get my job-search task</Link>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><span className="h-2.5 w-2.5 rounded-full bg-sun" />Ready to apply <span className="text-muted">{ready?.length ?? 0}</span></h2>
          {ready?.length ? (
            <div className="sheet divide-y divide-line">
              {ready.map((r) => {
                const j = r.job as unknown as Job;
                return (
                  <div key={j.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0"><div className="truncate font-semibold">{j.title}</div><div className="truncate text-sm text-muted">{j.company}{j.location ? `, ${j.location}` : ""}</div></div>
                    <Link href={`/jobs/${j.id}`} className="btn-accent btn-sm shrink-0">Apply</Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="sheet p-5 text-sm text-muted">Jobs with a finished tailored resume show up here, ready for you to submit.</p>
          )}
        </section>

        <section className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold">Your pipeline</h2>
          <div className="sheet space-y-3 p-5">
            {APP_STATUSES.map((s) => (
              <Link key={s} href="/applications" className="flex items-center gap-3 text-sm">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[s]}`} />
                <span className="w-20 font-medium capitalize">{s}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas"><span className={`block h-full rounded-full ${STATUS_DOT[s]}`} style={{ width: `${(counts[s] / max) * 100}%` }} /></span>
                <span className="w-5 text-right font-semibold tabular-nums">{counts[s]}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {rest.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">More matches</h2><Link href="/jobs" className="text-sm font-semibold text-brand">See all</Link></div>
          <div className="sheet divide-y divide-line">
            {rest.map((m) => { const j = m.job as unknown as Job; return <JobRow key={j.id} job={j} score={m.score} reason={m.reasons?.[0]} />; })}
          </div>
        </section>
      )}
    </div>
  );
}
