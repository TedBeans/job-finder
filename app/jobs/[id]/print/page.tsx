import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase";
import { renderMd } from "@/lib/md";

export const dynamic = "force-dynamic";

export default async function Print({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ doc?: string }> }) {
  const { id } = await params;
  const { doc } = await searchParams;
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const { data } = await auth.sb.from("tailored_resumes").select("*").eq("user_id", auth.user.id).eq("job_id", id).maybeSingle();
  if (!data) notFound();
  const md = doc === "cover" ? data.cover_letter_md ?? "" : data.resume_md;
  return (
    <div className="mx-auto max-w-[8.5in] bg-white p-8 text-[11pt] leading-snug">
      <p className="no-print mb-4 text-sm text-slate-500">Use your browser&apos;s Print &rarr; Save as PDF.</p>
      <div className="md" dangerouslySetInnerHTML={{ __html: renderMd(md) }} />
    </div>
  );
}
