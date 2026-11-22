import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase";
import { setMatchStatus } from "../actions";
import type { Job } from "@/lib/types";

export const dynamic = "force-dynamic";

const fmt = (n: number | null) => (n ? `$${Math.round(n / 1000)}k` : null);

export default async function Jobs({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const { view = "new" } = await searchParams;
  const status = ["new", "saved", "dismissed"].includes(view) ? view : "new";
  const { data } = await auth.sb
    .from("matches")
    .select("score, reasons, concerns, job:jobs(*)")
    .eq("user_id", auth.user.id)
    .eq("status", status)
    .order("score", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["new", "saved", "dismissed"].map((v) => (
          <Link key={v} href={`/jobs?view=${v}`} className={status === v ? "btn" : "btn-ghost"}>{v}</Link>
        ))}
      </div>
      {(data ?? []).map((m) => {
        const j = m.job as unknown as Job;
        const sal = j.salary_min || j.salary_max ? `${fmt(j.salary_min) ?? "?"}-${fmt(j.salary_max) ?? "?"}` : null;
        return (
          <div key={j.id} className="card flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="w-14 shrink-0 rounded-lg bg-slate-900 py-2 text-center text-xl font-bold text-white">{m.score}</div>
            <div className="min-w-0 flex-1">
              <Link href={`/jobs/${j.id}`} className="font-semibold hover:underline">{j.title}</Link>
              <div className="text-sm text-slate-600">{j.company} - {j.location ?? "n/a"} {j.work_mode && `- ${j.work_mode}`} {sal && `- ${sal}`}</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">{m.reasons?.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
              {m.concerns?.length > 0 && <ul className="mt-1 list-disc pl-5 text-sm text-amber-700">{m.concerns.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>}
            </div>
            <div className="flex gap-2 sm:flex-col">
              <Link href={`/jobs/${j.id}`} className="btn">Open</Link>
              {status !== "saved" && <form action={setMatchStatus.bind(null, j.id, "saved")}><button className="btn-ghost w-full">Save</button></form>}
              {status !== "dismissed" && <form action={setMatchStatus.bind(null, j.id, "dismissed")}><button className="btn-ghost w-full">Dismiss</button></form>}
            </div>
          </div>
        );
      })}
      {!data?.length && <p className="card text-sm text-slate-600">Nothing here yet.</p>}
    </div>
  );
}
