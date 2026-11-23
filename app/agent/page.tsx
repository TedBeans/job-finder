import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireUser } from "@/lib/supabase";
import { rotateIngestToken } from "../actions";
import { buildAgentPrompt } from "@/lib/agentPrompt";
import { CopyButton } from "@/components/CopyButton";
import { ImportBox } from "@/components/ImportBox";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-5 p-6 sm:gap-8 sm:p-8">
      <span className="font-display text-5xl font-extrabold leading-none text-brand">{n}</span>
      <div className="min-w-0 flex-1 space-y-3"><h2 className="text-lg font-bold">{title}</h2>{children}</div>
    </li>
  );
}

export default async function Agent() {
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const { data: p } = await auth.sb.from("profiles").select("*").eq("user_id", auth.user.id).maybeSingle<Profile>();
  if (!p?.resume_text) redirect("/profile?welcome=1");
  const h = await headers();
  const endpoint = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}/api/ingest`;

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold">Find jobs</h1>
        <p className="mt-1 text-muted">Your own AI, Claude or Muse, searches for jobs, scores them and writes your tailored resumes. It runs on your plan, so this app costs nothing to use.</p>
      </header>
      <ol className="sheet divide-y divide-line">
        <Step n={1} title="Copy your job-search task">
          <p className="hint">It already includes your resume and everything you&apos;re looking for. Copy it again after you change your profile.</p>
          <CopyButton text={buildAgentPrompt(p, endpoint)} label="Copy my job-search task" className="btn" />
        </Step>
        <Step n={2} title="Run it in Claude or Muse">
          <p className="hint">Paste it into a new chat. To get fresh jobs every morning, set it up as a daily recurring task. The reply is a block of JSON.</p>
        </Step>
        <Step n={3} title="Bring the results here">
          <p className="hint">Copy the whole reply and paste it below.</p>
          <ImportBox />
          <div className="rounded-xl bg-canvas p-4">
            <p className="text-sm font-semibold">Skip the pasting</p>
            <p className="hint mt-1">If your agent can send web requests, the task already tells it to deliver results straight to this app using your private token. Try it once to see if yours can.</p>
            <form action={rotateIngestToken} className="mt-3"><button className="btn-ghost btn-sm">{p.ingest_token ? "Reset my token, then copy the task again" : "Create my private token"}</button></form>
          </div>
        </Step>
      </ol>
    </div>
  );
}
