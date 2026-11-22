import type Anthropic from "@anthropic-ai/sdk";
import { claude, SMART, textOf, extractJson } from "./claude";
import type { Profile, RawJob } from "./types";

type Found = {
  title: string;
  company: string;
  location?: string;
  work_mode?: "remote" | "hybrid" | "onsite" | null;
  salary_min?: number | null;
  salary_max?: number | null;
  url: string;
  summary?: string;
};

/** Use Claude's built-in web search to find fresh postings on company career pages / ATS boards. */
export async function searchJobsWithClaude(profile: Profile, max = 12): Promise<RawJob[]> {
  const c = claude();
  const prompt = `Find up to ${max} CURRENT, open job postings (posted in the last ~14 days if possible) that fit this candidate. Prefer direct company career pages or ATS boards (Greenhouse, Lever, Ashby, Workday, company sites) over aggregators. Every URL must be a real posting you actually saw in search results - never guess URLs.

Candidate headline: ${profile.headline ?? ""}
Target titles: ${profile.target_titles.join(", ")}
Seniority: ${profile.seniority.join(", ")}
Locations: ${profile.locations.join(", ")}
Work modes accepted: ${profile.work_modes.join(", ")}
Minimum salary: ${profile.min_salary ?? "not specified"}
Industries: ${profile.industries.join(", ")}
Must-haves: ${profile.must_haves ?? ""}
Deal-breakers: ${profile.deal_breakers ?? ""}

When done, reply with ONLY a JSON array (no prose) of objects:
{"title","company","location","work_mode":"remote|hybrid|onsite|null","salary_min":number|null,"salary_max":number|null,"url","summary":"2-3 sentence description of the role and key requirements"}`;

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];
  let last: Anthropic.Message | null = null;
  for (let i = 0; i < 4; i++) {
    last = await c.messages.create({
      model: SMART(),
      max_tokens: 6000,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }],
      messages,
    });
    if (last.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: last.content });
  }
  if (!last) return [];
  const found = extractJson<Found[]>(textOf(last)) ?? [];
  return found
    .filter((f) => f.url?.startsWith("http") && f.title && f.company)
    .map((f) => ({
      source: "claude-search",
      external_id: f.url,
      title: f.title,
      company: f.company,
      location: f.location ?? null,
      work_mode: f.work_mode ?? null,
      salary_min: f.salary_min ?? null,
      salary_max: f.salary_max ?? null,
      url: f.url,
      description: f.summary ?? null,
      posted_at: null,
    }));
}
