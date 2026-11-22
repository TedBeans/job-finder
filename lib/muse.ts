import type { Profile, RawJob } from "./types";

// Valid Muse categories/levels. Used to constrain what Claude may pick for a profile.
export const MUSE_CATEGORIES = [
  "Account Management","Accounting and Finance","Administration and Office","Advertising and Marketing",
  "Business Operations","Computer and IT","Customer Service","Data and Analytics","Data Science",
  "Design and UX","Education","Healthcare","Human Resources and Recruitment","Legal Services",
  "Management","Manufacturing and Warehouse","Media, PR, and Communications","Nonprofit","Product",
  "Project Management","Real Estate","Retail","Sales","Science and Engineering","Software Engineering",
  "Transportation and Logistics","Writing and Editing",
];

const LEVELS: Record<string, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior Level",
  lead: "Senior Level",
  manager: "management",
  director: "management",
  executive: "management",
  intern: "Internship",
};

type MuseJob = {
  id: number;
  name: string;
  contents?: string;
  publication_date?: string;
  locations?: { name: string }[];
  levels?: { name: string }[];
  refs?: { landing_page?: string };
  company?: { name?: string };
};

const strip = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

function workMode(locs: string[]): string | null {
  const joined = locs.join(" ").toLowerCase();
  if (joined.includes("flexible") || joined.includes("remote")) return "remote";
  return null;
}

/** Fetch up to `pages` pages per category from The Muse public jobs API. */
export async function fetchMuse(profile: Profile, pages = 3): Promise<RawJob[]> {
  const cats = profile.muse_categories?.length ? profile.muse_categories : [];
  if (!cats.length) return [];
  const levels = [...new Set(profile.seniority.map((s) => LEVELS[s.toLowerCase()]).filter(Boolean))];
  const wantsRemote = profile.work_modes.includes("remote");
  const locations = [...profile.locations];
  if (wantsRemote) locations.push("Flexible / Remote");

  const out: RawJob[] = [];
  for (let page = 0; page < pages; page++) {
    const qs = new URLSearchParams({ page: String(page), descending: "true" });
    cats.forEach((c) => qs.append("category", c));
    levels.forEach((l) => qs.append("level", l));
    locations.forEach((l) => qs.append("location", l));
    if (process.env.MUSE_API_KEY) qs.set("api_key", process.env.MUSE_API_KEY);
    const res = await fetch(`https://www.themuse.com/api/public/jobs?${qs}`, { cache: "no-store" });
    if (!res.ok) break;
    const data = (await res.json()) as { results?: MuseJob[]; page_count?: number };
    for (const j of data.results ?? []) {
      const locs = (j.locations ?? []).map((l) => l.name);
      if (!j.refs?.landing_page) continue;
      out.push({
        source: "muse",
        external_id: String(j.id),
        title: j.name,
        company: j.company?.name ?? "Unknown",
        location: locs.join("; ") || null,
        work_mode: workMode(locs),
        salary_min: null,
        salary_max: null,
        url: j.refs.landing_page,
        description: j.contents ? strip(j.contents).slice(0, 6000) : null,
        posted_at: j.publication_date ?? null,
      });
    }
    if (page + 1 >= (data.page_count ?? 0)) break;
  }
  return out;
}
