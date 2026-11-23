import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase";
import { Questionnaire } from "@/components/Questionnaire";
import { emptyAnswers, type Answers } from "@/lib/questionnaire";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function QuestionnairePage() {
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const { data: p } = await auth.sb.from("profiles").select("*").eq("user_id", auth.user.id).maybeSingle<Profile>();

  const base = emptyAnswers();
  let initial: Answers = { ...base, ...(p?.preferences as Partial<Answers> | null) };
  if (!p?.preferences) {
    // No saved answers yet: start from whatever the profile already holds.
    initial = {
      ...base,
      customTitles: p?.target_titles?.join(", ") ?? "",
      seniority: p?.seniority ?? [],
      modes: p?.work_modes?.length ? p?.work_modes : base.modes,
      city: p?.locations?.[0] ?? "",
      payMin: p?.min_salary ? String(p?.min_salary) : "",
      customSettings: p?.industries?.join(", ") ?? "",
    };
  }
  return <Questionnaire initial={initial} name={p?.full_name?.split(" ")[0]} />;
}
