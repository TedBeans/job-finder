export type FieldKey = "healthcare" | "operations" | "sales" | "admin" | "finance" | "tech" | "education" | "marketing" | "hr" | "customer" | "trades" | "other";

export const FIELDS: Record<FieldKey, { label: string; roles: string[]; settings: string[]; avoid: string[] }> = {
  healthcare: {
    label: "Nursing and healthcare",
    roles: ["School nurse", "Telehealth triage nurse", "Outpatient clinic nurse", "Nurse case manager", "Utilization review nurse", "Nurse educator", "Occupational health nurse", "Home health nurse", "Hospice nurse", "Public health nurse", "Infusion center nurse", "Pediatric clinic nurse", "Behavioral health nurse", "Clinical research nurse", "Quality improvement nurse", "Clinical informatics nurse", "Insurance clinical reviewer"],
    settings: ["Schools and universities", "Outpatient clinics", "Telehealth companies", "Insurance companies", "Home health and hospice", "Public health and government", "Corporate and occupational health", "Research and pharma", "Nonprofits", "Behavioral health practices", "Dialysis and infusion centers", "Health software companies"],
    avoid: ["Hospitals and inpatient units", "Night shifts", "Weekends", "Holidays", "12-hour shifts", "Floating between units", "Heavy lifting"],
  },
  operations: {
    label: "Operations, supply chain and logistics",
    roles: ["Operations manager", "Warehouse manager", "Supply chain analyst", "Logistics coordinator", "Demand planner", "Procurement specialist", "Inventory manager", "Distribution center manager", "Customer experience manager", "Production planner"],
    settings: ["Food and beverage", "Consumer goods", "Retail and e-commerce", "Manufacturing", "Third-party logistics", "Healthcare supply", "Distribution", "Transportation"],
    avoid: ["Night shifts", "Weekends", "Working on the floor all day", "Commission-only pay"],
  },
  sales: {
    label: "Sales and account management",
    roles: ["Account executive", "Account manager", "Sales representative", "Business development", "Inside sales", "Sales analyst", "Customer success manager"],
    settings: ["Software", "Healthcare", "Consumer goods", "Manufacturing", "Financial services", "Staffing", "Real estate"],
    avoid: ["Commission-only pay", "Cold calling all day", "Quotas I can't see", "Door-to-door"],
  },
  admin: {
    label: "Administrative and office",
    roles: ["Executive assistant", "Office manager", "Administrative coordinator", "Project coordinator", "Scheduler", "Receptionist", "Operations coordinator"],
    settings: ["Healthcare", "Education", "Law firms", "Nonprofits", "Government", "Small businesses", "Corporate offices"],
    avoid: ["Front-desk only", "Answering phones all day", "Weekends"],
  },
  finance: {
    label: "Finance and accounting",
    roles: ["Accountant", "Financial analyst", "Bookkeeper", "Accounts payable specialist", "Accounts receivable specialist", "Payroll specialist", "Controller", "Auditor"],
    settings: ["Corporate finance", "Public accounting", "Banking", "Insurance", "Nonprofits", "Healthcare", "Government"],
    avoid: ["Busy season overtime", "Heavy travel", "Commission-only pay"],
  },
  tech: {
    label: "Technology and data",
    roles: ["Software engineer", "Data analyst", "IT support specialist", "QA engineer", "Product manager", "UX designer", "DevOps engineer", "Business analyst"],
    settings: ["Software companies", "Healthcare tech", "Finance and fintech", "E-commerce", "Government", "Education technology", "Startups"],
    avoid: ["On-call rotations", "Heavy travel", "Constant crunch time"],
  },
  education: {
    label: "Education and training",
    roles: ["Teacher", "Instructional designer", "Corporate trainer", "Curriculum developer", "Teaching assistant", "School administrator", "Tutor"],
    settings: ["K-12 schools", "Colleges and universities", "Corporate training", "Nonprofits", "Online learning", "Childcare"],
    avoid: ["Summer work", "Evenings", "Classroom discipline roles"],
  },
  marketing: {
    label: "Marketing and communications",
    roles: ["Marketing manager", "Marketing coordinator", "Content writer", "Social media manager", "Brand manager", "SEO specialist", "Communications specialist"],
    settings: ["Agencies", "Consumer brands", "Software", "Healthcare", "Nonprofits", "Education"],
    avoid: ["Agency overtime", "Heavy travel", "Cold outreach"],
  },
  hr: {
    label: "Human resources and recruiting",
    roles: ["HR generalist", "Recruiter", "HR coordinator", "Talent acquisition partner", "Benefits specialist", "Training coordinator"],
    settings: ["Healthcare", "Manufacturing", "Staffing", "Corporate", "Nonprofits", "Education"],
    avoid: ["High-volume recruiting quotas", "Heavy travel"],
  },
  customer: {
    label: "Customer service and support",
    roles: ["Customer service representative", "Customer success specialist", "Support specialist", "Call center team lead", "Client services coordinator"],
    settings: ["Software", "Healthcare", "Retail", "Financial services", "Utilities", "E-commerce"],
    avoid: ["Rotating shifts", "Phones all day", "Weekends"],
  },
  trades: {
    label: "Manufacturing and skilled trades",
    roles: ["Production supervisor", "Maintenance technician", "Quality inspector", "Machine operator", "Electrician", "Welder", "Shipping and receiving lead"],
    settings: ["Food production", "Automotive", "Aerospace", "Construction", "Utilities", "Warehousing"],
    avoid: ["Night shifts", "Weekends", "Mandatory overtime", "Heavy lifting"],
  },
  other: { label: "Something else", roles: [], settings: [], avoid: ["Night shifts", "Weekends", "Holidays"] },
};

export const COMMON_AVOID = ["Long commute", "Mandatory overtime", "Heavy travel", "On-call", "Commission-only pay"];
export const SENIORITY = [["entry", "Entry level"], ["mid", "Mid level"], ["senior", "Senior"], ["lead", "Team lead"], ["manager", "Manager"], ["director", "Director"], ["executive", "Executive"]] as const;
export const SCHEDULE = ["Weekdays only", "Daytime hours", "Evenings", "Overnight", "Weekends are fine", "Rotating shifts are fine", "Full-time", "Part-time", "Per diem or contract", "Compressed week (4 x 10)", "Flexible hours", "A predictable schedule"];
export const BENEFITS = ["Health insurance", "Dental and vision", "Retirement match", "Paid time off", "Paid holidays", "Tuition or training help", "Student loan help", "Sign-on bonus", "Remote work stipend", "Parental leave"];
export const PRIORITIES = ["Work-life balance", "Pay", "Growth and promotion", "A meaningful mission", "Team and culture", "Job security", "Flexibility", "Learning new skills", "A short commute", "Benefits", "Low stress"];
export const COMPANY_TYPES = ["Large company", "Small company", "Startup", "Nonprofit", "Government or public sector", "School or university", "Family-owned"];
export const COMMUTES: [string, number | null][] = [["15 minutes", 15], ["30 minutes", 30], ["45 minutes", 45], ["An hour", 60], ["Any distance", null]];
export const TRAVEL = ["No travel", "Up to 10%", "Up to 25%", "Up to 50%", "Any amount"];
export const RELOCATE = ["No", "Maybe, for the right job", "Yes"];

export type Answers = {
  field: FieldKey | "";
  titles: string[]; customTitles: string;
  settings: string[]; customSettings: string; companyTypes: string[];
  avoid: string[]; avoidText: string;
  seniority: string[];
  schedule: string[]; scheduleText: string;
  modes: string[]; city: string; commute: number | null; relocate: string; travel: string;
  payType: "year" | "hour"; payMin: string; payTarget: string; benefits: string[];
  credentials: string; training: string;
  priorities: string[]; liked: string; disliked: string; extra: string;
};

export const emptyAnswers = (): Answers => ({
  field: "", titles: [], customTitles: "", settings: [], customSettings: "", companyTypes: [], avoid: [], avoidText: "", seniority: [],
  schedule: [], scheduleText: "", modes: ["remote", "hybrid", "onsite"], city: "", commute: null, relocate: "", travel: "",
  payType: "year", payMin: "", payTarget: "", benefits: [], credentials: "", training: "", priorities: [], liked: "", disliked: "", extra: "",
});

export const splitList = (s: string) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
const uniq = (a: string[]) => [...new Set(a.map((x) => x.trim()).filter(Boolean))];
const num = (s: string) => { const n = parseFloat(s.replace(/[^0-9.]/g, "")); return Number.isFinite(n) && n > 0 ? n : null; };
const list = (a: string[]) => a.join(", ");

/** Turns questionnaire answers into the profile fields the job-search task reads. Plain code, no AI. */
export function compose(a: Answers) {
  const titles = uniq([...a.titles, ...splitList(a.customTitles)]);
  const industries = uniq([...a.settings, ...splitList(a.customSettings)]);
  const pay = num(a.payMin);
  const target = num(a.payTarget);
  const annual = (n: number) => (a.payType === "hour" ? Math.round(n * 2080) : Math.round(n));
  const money = (n: number) => (a.payType === "hour" ? `$${n}/hour (about $${annual(n).toLocaleString("en-US")}/year)` : `$${Math.round(n).toLocaleString("en-US")}/year`);

  const must: string[] = [];
  if (a.schedule.length || a.scheduleText.trim()) must.push(`Schedule: ${[list(a.schedule), a.scheduleText.trim()].filter(Boolean).join(". ")}.`);
  if (a.city.trim() && a.commute) must.push(`Commute: within ${a.commute} minutes of ${a.city.trim()} for on-site or hybrid work.`);
  if (target) must.push(`Pay I'm aiming for: ${money(target)}.`);
  if (a.benefits.length) must.push(`Benefits that matter: ${list(a.benefits)}.`);
  if (a.priorities.length) must.push(`Top priorities: ${list(a.priorities)}.`);
  if (a.companyTypes.length) must.push(`Prefer to work for: ${list(a.companyTypes)}.`);
  if (a.credentials.trim()) must.push(`Credentials and licenses I hold: ${a.credentials.trim()}.`);
  if (a.training === "Yes") must.push("Open to jobs that need extra training.");
  if (a.relocate) must.push(`Willing to relocate: ${a.relocate}.`);
  if (a.liked.trim()) must.push(`What I liked in past jobs: ${a.liked.trim()}`);
  if (a.extra.trim()) must.push(`Also: ${a.extra.trim()}`);

  const deal: string[] = [];
  if (a.avoid.length) deal.push(`Avoid: ${list(a.avoid)}.`);
  if (a.avoidText.trim()) deal.push(`Also avoid: ${a.avoidText.trim()}`);
  if (a.travel && a.travel !== "Any amount") deal.push(`Travel limit: ${a.travel.toLowerCase()}.`);
  if (a.disliked.trim()) deal.push(`What I disliked in past jobs: ${a.disliked.trim()}`);

  return {
    target_titles: titles,
    industries,
    seniority: a.seniority,
    work_modes: a.modes,
    locations: a.city.trim() ? [a.city.trim()] : [],
    min_salary: pay ? annual(pay) : null,
    must_haves: must.join("\n"),
    deal_breakers: deal.join("\n"),
  };
}
