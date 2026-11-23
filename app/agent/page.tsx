import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireUser } from "@/lib/supabase";
import { rotateIngestToken } from "../actions";
import { buildAgentPrompt } from "@/lib/agentPrompt";
import { CopyButton } from "@/components/CopyButton";
import { ImportBox } from "@/components/ImportBox";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Agent() {
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const { data: p } = await auth.sb.from("profiles").select("*").eq("user_id", auth.user.id).maybeSingle<Profile>();
  if (!p?.resume_text) redirect("/profile?welcome=1");
  const h = await headers();
  const endpoint = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}/api/ingest`;
  const prompt = buildAgentPrompt(p, endpoint);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">Find jobs</h1>
      <p className="text-sm text-slate-600">
        Your own AI (Claude, Muse, or similar) does the searching, scoring and resume tailoring using your subscription - the app itself needs no AI key and costs nothing to run. The results land on your dashboard.
      </p>

      <div className="card space-y-3">
        <h2 className="font-semibold">Step 1 - Copy your job-search task</h2>
        <p className="text-sm text-slate-600">It already contains your resume and what you&apos;re looking for. Re-copy it after you change your profile.</p>
        <CopyButton text={prompt} label="Copy my job-search task" className="btn" />
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Step 2 - Run it in your agent</h2>
        <p className="text-sm text-slate-600">
          Paste it into Claude or Muse. For automatic daily runs, set it up as a scheduled/recurring task (every morning). The reply is a block of JSON.
        </p>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Step 3 - Get the results into the app</h2>
        <p className="text-sm text-slate-600"><b>Paste:</b> copy the agent&apos;s JSON reply and drop it here.</p>
        <ImportBox />
        <hr />
        <p className="text-sm text-slate-600">
          <b>Automatic:</b> if your agent can send web requests, the task also tells it to POST results straight to the app using your private token, so you don&apos;t have to paste. Not every agent can do this - try it once.
        </p>
        <form action={rotateIngestToken}>
          <button className="btn-ghost">{p.ingest_token ? "Rotate token (re-copy the task after)" : "Create my private token"}</button>
        </form>
      </div>
    </div>
  );
}
