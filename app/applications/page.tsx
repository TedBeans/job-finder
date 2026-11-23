import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase";
import { setAppStatus } from "../actions";
import { STATUS_DOT } from "@/lib/status";
import { APP_STATUSES, type Job } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Applications() {
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const { data } = await auth.sb.from("applications").select("*, job:jobs(*)").eq("user_id", auth.user.id).order("updated_at", { ascending: false });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Applications</h1>
      {!data?.length && <p className="sheet p-8 text-center text-muted">Nothing tracked yet. Save a match or tailor a resume and it will appear here.</p>}
      <div className="-mx-5 overflow-x-auto px-5 pb-4 lg:-mx-10 lg:px-10">
        <div className="grid min-w-[1180px] grid-cols-8 gap-3">
          {APP_STATUSES.map((s) => {
            const col = (data ?? []).filter((a) => a.status === s);
            return (
              <section key={s} className="rounded-2xl bg-white/50 p-2">
                <h2 className="mb-2 flex items-center gap-2 px-2 pt-1 font-sans text-sm font-bold capitalize tracking-normal">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[s]}`} />{s}<span className="font-medium text-muted">{col.length}</span>
                </h2>
                <div className="space-y-2">
                  {col.map((a) => {
                    const j = a.job as unknown as Job;
                    const due = a.follow_up_at && a.follow_up_at <= today && !["rejected", "withdrawn", "offer"].includes(s);
                    return (
                      <div key={a.id} className="rounded-xl border border-line bg-white p-3 text-sm">
                        <Link href={`/jobs/${j.id}`} className="font-semibold leading-snug hover:text-brand">{j.title}</Link>
                        <div className="text-muted">{j.company}</div>
                        {a.follow_up_at && <div className={`mt-1 text-xs font-medium ${due ? "text-warn" : "text-muted"}`}>{due ? "Follow up now" : `Follow up ${a.follow_up_at}`}</div>}
                        <form action={setAppStatus} className="mt-2 flex gap-1.5">
                          <input type="hidden" name="jobId" value={j.id} />
                          <select name="status" defaultValue={s} aria-label="Move to" className="input min-w-0 flex-1 px-2 py-1 text-xs capitalize">{APP_STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
                          <button className="btn-ghost btn-sm">Move</button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
