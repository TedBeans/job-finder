import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase";
import { ScanButton } from "@/components/ScanButton";
import { aiEnabled } from "@/lib/ai";
import { APP_STATUSES, type Job } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const { sb, user } = auth;
  const { data: profile } = await sb.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!profile?.resume_text) redirect("/profile?welcome=1");

  const [{ data: top }, { data: apps }, { count: newCount }, { data: ready }] = await Promise.all([
    sb.from("matches").select("score, reasons, job:jobs(*)").eq("user_id", user.id).eq("status", "new").order("score", { ascending: false }).limit(5),
    sb.from("applications").select("status").eq("user_id", user.id),
    sb.from("matches").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "new"),
    sb.from("applications").select("job:jobs(*)").eq("user_id", user.id).eq("status", "ready").order("updated_at", { ascending: false }).limit(10),
  ]);
  const counts = Object.fromEntries(APP_STATUSES.map((s) => [s, (apps ?? []).filter((a) => a.status === s).length]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hi {profile.full_name?.split(" ")[0] || "there"}</h1>
          <p className="text-sm text-slate-600">
            {newCount ?? 0} new matches. Last update: {profile.last_scan_at ? new Date(profile.last_scan_at).toLocaleString() : "never"}.
          </p>
        </div>
        {aiEnabled() ? <ScanButton /> : <Link href="/agent" className="btn">Find jobs</Link>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {APP_STATUSES.map((s) => (
          <Link key={s} href="/applications" className="card text-center">
            <div className="text-2xl font-bold">{counts[s]}</div>
            <div className="text-xs uppercase text-slate-500">{s}</div>
          </Link>
        ))}
      </div>

      {(ready?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Ready to apply ({ready!.length})</h2>
          <p className="mb-2 text-sm text-slate-600">Resumes are already tailored. Open one, apply, then mark it applied.</p>
          <div className="space-y-2">
            {ready!.map((r) => {
              const job = r.job as unknown as Job;
              return (
                <Link key={job.id} href={`/jobs/${job.id}`} className="card flex items-center justify-between hover:border-slate-400">
                  <div>
                    <div className="font-medium">{job.title}</div>
                    <div className="text-sm text-slate-600">{job.company} - {job.location ?? "Location n/a"}</div>
                  </div>
                  <span className="btn">Apply</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Top matches</h2>
          <Link href="/jobs" className="text-sm text-slate-600 underline">See all</Link>
        </div>
        <div className="space-y-2">
          {(top ?? []).map((m) => {
            const job = m.job as unknown as Job;
            return (
              <Link key={job.id} href={`/jobs/${job.id}`} className="card flex items-start gap-4 hover:border-slate-400">
                <div className="w-12 rounded-lg bg-slate-900 py-2 text-center text-lg font-bold text-white">{m.score}</div>
                <div>
                  <div className="font-medium">{job.title}</div>
                  <div className="text-sm text-slate-600">{job.company} - {job.location ?? "Location n/a"}</div>
                  <div className="mt-1 text-sm text-slate-500">{m.reasons?.[0]}</div>
                </div>
              </Link>
            );
          })}
          {!top?.length && <p className="card text-sm text-slate-600">No matches yet. Go to Find jobs to get your job-search task.</p>}
        </div>
      </section>
    </div>
  );
}
