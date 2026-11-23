import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase";
import { setMatchStatus } from "../actions";
import { JobRow } from "@/components/JobRow";
import type { Job } from "@/lib/types";

export const dynamic = "force-dynamic";

const TABS = [["new", "New"], ["saved", "Saved"], ["dismissed", "Dismissed"]] as const;

export default async function Jobs({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const { view = "new" } = await searchParams;
  const status = TABS.some(([v]) => v === view) ? view : "new";
  const { data } = await auth.sb.from("matches").select("score, reasons, concerns, job:jobs(*)").eq("user_id", auth.user.id).eq("status", status).order("score", { ascending: false }).limit(100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Matches</h1>
        <div className="inline-flex rounded-xl border border-line bg-white p-1" role="tablist">
          {TABS.map(([v, label]) => (
            <Link key={v} href={`/jobs?view=${v}`} role="tab" aria-selected={status === v} className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${status === v ? "bg-brand text-white" : "text-muted hover:text-ink"}`}>{label}</Link>
          ))}
        </div>
      </div>
      {data?.length ? (
        <div className="sheet divide-y divide-line">
          {data.map((m) => {
            const j = m.job as unknown as Job;
            return (
              <JobRow key={j.id} job={j} score={m.score} reason={m.reasons?.[0]} actions={
                <>
                  {status !== "saved" && <form action={setMatchStatus.bind(null, j.id, "saved")}><button className="btn-ghost btn-sm">Save</button></form>}
                  {status !== "dismissed" && <form action={setMatchStatus.bind(null, j.id, "dismissed")}><button className="btn-ghost btn-sm">Dismiss</button></form>}
                </>
              } />
            );
          })}
        </div>
      ) : (
        <p className="sheet p-8 text-center text-muted">{status === "new" ? "No new matches. Run your job-search task from Find jobs to bring some in." : `Nothing ${status} yet.`}</p>
      )}
    </div>
  );
}
