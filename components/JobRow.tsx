import Link from "next/link";
import { Score } from "./Score";
import type { Job } from "@/lib/types";

const k = (n: number | null) => (n ? `$${Math.round(n / 1000)}k` : null);

export function JobRow({ job, score, reason, actions }: { job: Job; score: number; reason?: string; actions?: React.ReactNode }) {
  const sal = job.salary_min || job.salary_max ? `${k(job.salary_min) ?? "?"} to ${k(job.salary_max) ?? "?"}` : null;
  return (
    <div className="group flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:flex-nowrap sm:gap-6">
      <Score score={score} className="w-14 shrink-0 text-center" />
      <Link href={`/jobs/${job.id}`} className="min-w-0 flex-1 basis-0">
        <div className="truncate font-semibold group-hover:text-brand">{job.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span>{job.company}</span>
          {job.location && <span className="truncate">{job.location}</span>}
          {job.work_mode && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium capitalize text-brand">{job.work_mode}</span>}
          {sal && <span>{sal}</span>}
        </div>
        {reason && <p className="mt-1 line-clamp-1 text-sm">{reason}</p>}
      </Link>
      {actions && <div className="flex w-full shrink-0 gap-2 pl-[4.5rem] sm:w-auto sm:pl-0">{actions}</div>}
    </div>
  );
}
