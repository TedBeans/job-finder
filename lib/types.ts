export type Profile = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  resume_text: string | null;
  headline: string | null;
  target_titles: string[];
  locations: string[];
  work_modes: string[];
  min_salary: number | null;
  seniority: string[];
  industries: string[];
  must_haves: string | null;
  deal_breakers: string | null;
  muse_categories: string[];
  min_score: number;
  scan_enabled: boolean;
  ingest_token?: string | null;
  last_scan_at: string | null;
};

export type Job = {
  id: string;
  source: string;
  external_id: string;
  title: string;
  company: string;
  location: string | null;
  work_mode: string | null;
  salary_min: number | null;
  salary_max: number | null;
  url: string;
  description: string | null;
  posted_at: string | null;
  found_at: string;
};

export type RawJob = Omit<Job, "id" | "found_at">;

export const APP_STATUSES = [
  "saved",
  "ready",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;
export type AppStatus = (typeof APP_STATUSES)[number];
