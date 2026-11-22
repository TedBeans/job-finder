import { setAppStatus } from "@/app/actions";
import { APP_STATUSES } from "@/lib/types";

export function StatusForm({ jobId, status, notes, followUp }: { jobId: string; status: string; notes?: string | null; followUp?: string | null }) {
  return (
    <form action={setAppStatus} className="space-y-2">
      <input type="hidden" name="jobId" value={jobId} />
      <select name="status" defaultValue={status} className="input">
        {APP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <input type="date" name="follow_up_at" defaultValue={followUp ?? ""} className="input" title="Follow-up date" />
      <textarea name="notes" defaultValue={notes ?? ""} rows={3} placeholder="Notes (contacts, interview dates...)" className="input" />
      <button className="btn w-full">Save</button>
    </form>
  );
}
