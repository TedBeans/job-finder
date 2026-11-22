import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase";
import { setAppStatus } from "../actions";
import { APP_STATUSES, type Job } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Applications() {
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const { data } = await auth.sb.from("applications").select("*, job:jobs(*)").eq("user_id", auth.user.id).order("updated_at", { ascending: false });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[1100px] grid-cols-8 gap-3">
        {APP_STATUSES.map((s) => {
          const col = (data ?? []).filter((a) => a.status === s);
          return (
            <div key={s}>
              <h2 className="mb-2 text-xs font-bold uppercase text-slate-500">{s} ({col.length})</h2>
              <div className="space-y-2">
                {col.map((a) => {
                  const j = a.job as unknown as Job;
                  const due = a.follow_up_at && a.follow_up_at <= today && !["rejected", "withdrawn", "offer"].includes(s);
                  return (
                    <div key={a.id} className={`card p-3 text-sm ${due ? "border-amber-400" : ""}`}>
                      <Link href={`/jobs/${j.id}`} className="font-medium hover:underline">{j.title}</Link>
                      <div className="text-slate-600">{j.company}</div>
                      {a.follow_up_at && <div className={`text-xs ${due ? "font-semibold text-amber-700" : "text-slate-500"}`}>Follow up {a.follow_up_at}</div>}
                      <form action={setAppStatus} className="mt-2">
                        <input type="hidden" name="jobId" value={j.id} />
                        <select name="status" defaultValue={s} className="input py-1 text-xs">{APP_STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
                        <button className="mt-1 w-full rounded border border-slate-300 py-1 text-xs hover:bg-slate-100">Move</button>
                      </form>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
