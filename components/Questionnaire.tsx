"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveQuestionnaire } from "@/app/actions";
import {
  Answers, FIELDS, FieldKey, COMMON_AVOID, SENIORITY, SCHEDULE, BENEFITS, PRIORITIES, COMPANY_TYPES,
  COMMUTES, TRAVEL, RELOCATE, compose, splitList,
} from "@/lib/questionnaire";

const STEPS = [
  { id: "roles", title: "What kind of work do you want?", hint: "Pick your field, then tap every role that sounds good. Choose as many as you like." },
  { id: "settings", title: "Where would you like to work?", hint: "Tap the kinds of workplaces that appeal to you." },
  { id: "avoid", title: "What do you want to stay away from?", hint: "Jobs with these will score much lower." },
  { id: "level", title: "What level are you looking for?", hint: "Choose all that fit." },
  { id: "schedule", title: "What schedule works for you?", hint: "Tap everything you're happy with." },
  { id: "where", title: "Where and how will you work?", hint: "Remote, hybrid, or in person, and how far you'll go." },
  { id: "pay", title: "What do you need to earn?", hint: "Jobs below your minimum won't show up." },
  { id: "creds", title: "Licenses, credentials and training", hint: "These help match you to roles that value them." },
  { id: "priorities", title: "What matters most in your next job?", hint: "Pick up to three." },
  { id: "story", title: "Tell us about past jobs", hint: "A sentence or two is plenty. This helps find the right fit." },
  { id: "review", title: "Check your answers", hint: "This is what your job search will use. Tap Edit on anything to change it." },
] as const;

function Chips({ options, value, onChange, max, label }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void; max?: number; label: string }) {
  const toggle = (o: string) => {
    if (value.includes(o)) return onChange(value.filter((x) => x !== o));
    if (max && value.length >= max) return;
    onChange([...value, o]);
  };
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" aria-pressed={on} onClick={() => toggle(o)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${on ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand"}`}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Single({ options, value, onChange, label }: { options: { k: string; label: string }[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value === o.k;
        return (
          <button key={o.k} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.k)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${on ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand"}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const Q = ({ children }: { children: React.ReactNode }) => <h3 className="mb-2 mt-6 text-sm font-bold first:mt-0">{children}</h3>;

export function Questionnaire({ initial, name }: { initial: Answers; name?: string }) {
  const router = useRouter();
  const [a, setA] = useState<Answers>(initial);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const head = useRef<HTMLHeadingElement>(null);
  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setA((p) => ({ ...p, [k]: v }));

  // Restore an unfinished draft on this device.
  useEffect(() => {
    try {
      const d = localStorage.getItem("jf-q-draft");
      if (d) { const j = JSON.parse(d); if (j?.a) { setA(j.a); setStep(Math.min(j.step ?? 0, STEPS.length - 1)); } }
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("jf-q-draft", JSON.stringify({ a, step })); } catch {} }, [a, step]);
  useEffect(() => { head.current?.focus(); }, [step]);

  const s = STEPS[step];
  const field = a.field ? FIELDS[a.field] : null;
  const c = useMemo(() => compose(a), [a]);

  const next = () => {
    if (s.id === "roles" && !c.target_titles.length) { setErr("Pick at least one job title to continue."); return; }
    if (s.id === "where" && !a.modes.length) { setErr("Choose at least one: remote, hybrid or on-site."); return; }
    setErr(""); setStep((x) => Math.min(x + 1, STEPS.length - 1)); window.scrollTo({ top: 0 });
  };
  const back = () => { setErr(""); setStep((x) => Math.max(0, x - 1)); window.scrollTo({ top: 0 }); };

  async function save() {
    setSaving(true); setErr("");
    const r = await saveQuestionnaire(a);
    if (r?.error) { setErr(r.error); setSaving(false); return; }
    try { localStorage.removeItem("jf-q-draft"); } catch {}
    router.push("/agent");
  }

  const pct = Math.round(((step + 1) / STEPS.length) * 100);
  const fieldOpts = (Object.keys(FIELDS) as FieldKey[]).map((k) => ({ k, label: FIELDS[k].label }));

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-semibold text-muted">{name ? `${name}, ` : ""}step {step + 1} of {STEPS.length}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
      <h1 ref={head} tabIndex={-1} className="mt-6 text-3xl font-extrabold outline-none">{s.title}</h1>
      <p className="mt-1 text-muted">{s.hint}</p>

      <div className="sheet mt-6 p-5 sm:p-6">
        {s.id === "roles" && (<>
          <Q>Your field</Q>
          <Single label="Field" options={fieldOpts} value={a.field} onChange={(v) => setA((p) => ({ ...p, field: v as FieldKey, titles: [], settings: [], avoid: [] }))} />
          {field && field.roles.length > 0 && (<><Q>Roles you&apos;d consider</Q><Chips label="Roles" options={field.roles} value={a.titles} onChange={(v) => set("titles", v)} /></>)}
          <Q>Other job titles</Q>
          <input aria-label="Other job titles" className="input" value={a.customTitles} onChange={(e) => set("customTitles", e.target.value)} placeholder="Separate with commas" />
          {c.target_titles.length > 0 && <p className="hint mt-2">{c.target_titles.length} selected</p>}
        </>)}

        {s.id === "settings" && (<>
          {field && field.settings.length > 0 && (<><Q>Types of employers or settings</Q><Chips label="Settings" options={field.settings} value={a.settings} onChange={(v) => set("settings", v)} /></>)}
          <Q>Anything else?</Q>
          <input aria-label="Other settings" className="input" value={a.customSettings} onChange={(e) => set("customSettings", e.target.value)} placeholder="Separate with commas" />
          <Q>Company size and type</Q>
          <Chips label="Company type" options={COMPANY_TYPES} value={a.companyTypes} onChange={(v) => set("companyTypes", v)} />
        </>)}

        {s.id === "avoid" && (<>
          <Chips label="Things to avoid" options={[...new Set([...(field?.avoid ?? []), ...COMMON_AVOID])]} value={a.avoid} onChange={(v) => set("avoid", v)} />
          <Q>Anything else to avoid?</Q>
          <textarea aria-label="Anything else to avoid" rows={2} className="input" value={a.avoidText} onChange={(e) => set("avoidText", e.target.value)} placeholder="For example: jobs that require a long commute" />
        </>)}

        {s.id === "level" && (
          <Chips label="Level" options={SENIORITY.map((x) => x[1])} value={a.seniority.map((k) => SENIORITY.find((x) => x[0] === k)?.[1] ?? k)}
            onChange={(v) => set("seniority", v.map((l) => SENIORITY.find((x) => x[1] === l)?.[0] ?? l))} />
        )}

        {s.id === "schedule" && (<>
          <Chips label="Schedule" options={SCHEDULE} value={a.schedule} onChange={(v) => set("schedule", v)} />
          <Q>Anything specific?</Q>
          <input aria-label="Schedule details" className="input" value={a.scheduleText} onChange={(e) => set("scheduleText", e.target.value)} placeholder="For example: home by 5pm for school pickup" />
        </>)}

        {s.id === "where" && (<>
          <Q>Where you&apos;ll work</Q>
          <Chips label="Work mode" options={["Remote", "Hybrid", "On-site"]} value={a.modes.map((m) => ({ remote: "Remote", hybrid: "Hybrid", onsite: "On-site" } as Record<string, string>)[m])}
            onChange={(v) => set("modes", v.map((l) => ({ Remote: "remote", Hybrid: "hybrid", "On-site": "onsite" } as Record<string, string>)[l]))} />
          <Q>Your city or ZIP code</Q>
          <input aria-label="City or ZIP" className="input" value={a.city} onChange={(e) => set("city", e.target.value)} placeholder="St. Louis, MO" />
          <Q>How far will you commute?</Q>
          <Single label="Commute" options={COMMUTES.map(([l, m]) => ({ k: String(m), label: l }))} value={String(a.commute)} onChange={(v) => set("commute", v === "null" ? null : Number(v))} />
          <Q>How much travel is OK?</Q>
          <Single label="Travel" options={TRAVEL.map((t) => ({ k: t, label: t }))} value={a.travel} onChange={(v) => set("travel", v)} />
          <Q>Would you relocate?</Q>
          <Single label="Relocate" options={RELOCATE.map((t) => ({ k: t, label: t }))} value={a.relocate} onChange={(v) => set("relocate", v)} />
        </>)}

        {s.id === "pay" && (<>
          <Q>How are you paid?</Q>
          <Single label="Pay type" options={[{ k: "year", label: "Salary (per year)" }, { k: "hour", label: "Hourly" }]} value={a.payType} onChange={(v) => set("payType", v as "year" | "hour")} />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="pm">Lowest you&apos;d accept</label><input id="pm" inputMode="decimal" className="input" value={a.payMin} onChange={(e) => set("payMin", e.target.value)} placeholder={a.payType === "hour" ? "35" : "75000"} /></div>
            <div><label className="label" htmlFor="pt">What you&apos;re aiming for</label><input id="pt" inputMode="decimal" className="input" value={a.payTarget} onChange={(e) => set("payTarget", e.target.value)} placeholder={a.payType === "hour" ? "42" : "90000"} /></div>
          </div>
          <Q>Benefits that matter</Q>
          <Chips label="Benefits" options={BENEFITS} value={a.benefits} onChange={(v) => set("benefits", v)} />
        </>)}

        {s.id === "creds" && (<>
          <label className="label" htmlFor="cr">Licenses and credentials you hold</label>
          <textarea id="cr" rows={3} className="input" value={a.credentials} onChange={(e) => set("credentials", e.target.value)} placeholder="For example: RN license (Missouri), BLS, ACLS" />
          <Q>Would you take extra training for the right job?</Q>
          <Single label="Training" options={[{ k: "Yes", label: "Yes" }, { k: "No", label: "No" }]} value={a.training} onChange={(v) => set("training", v)} />
        </>)}

        {s.id === "priorities" && <Chips label="Priorities" options={PRIORITIES} max={3} value={a.priorities} onChange={(v) => set("priorities", v)} />}

        {s.id === "story" && (<>
          <label className="label" htmlFor="li">What did you like about past jobs?</label>
          <textarea id="li" rows={3} className="input" value={a.liked} onChange={(e) => set("liked", e.target.value)} />
          <Q>What did you dislike?</Q>
          <textarea aria-label="What you disliked" rows={3} className="input" value={a.disliked} onChange={(e) => set("disliked", e.target.value)} />
          <Q>Anything else we should know?</Q>
          <textarea aria-label="Anything else" rows={3} className="input" value={a.extra} onChange={(e) => set("extra", e.target.value)} />
        </>)}

        {s.id === "review" && (
          <dl className="divide-y divide-line text-sm">
            {([
              ["Job titles", c.target_titles.join(", "), 0],
              ["Workplaces", [...c.industries, ...a.companyTypes].join(", "), 1],
              ["Level", c.seniority.join(", "), 3],
              ["Work mode and place", [c.work_modes.join(", "), c.locations.join(", ")].filter(Boolean).join(" · "), 5],
              ["Minimum pay", c.min_salary ? `$${c.min_salary.toLocaleString("en-US")} a year` : "", 6],
              ["Must-haves", c.must_haves, 4],
              ["Deal-breakers", c.deal_breakers, 2],
            ] as [string, string, number][]).map(([k, v, i]) => (
              <div key={k} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0"><dt className="font-semibold">{k}</dt><dd className="mt-0.5 whitespace-pre-line text-muted">{v || "Not set"}</dd></div>
                <button type="button" className="btn-ghost btn-sm shrink-0" onClick={() => setStep(i)}>Edit</button>
              </div>
            ))}
          </dl>
        )}
      </div>

      {err && <p role="alert" className="mt-4 text-sm font-semibold text-red-700">{err}</p>}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" className="btn-ghost" onClick={back} disabled={step === 0}>Back</button>
        {s.id === "review"
          ? <button type="button" className="btn-accent" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save and find jobs"}</button>
          : <button type="button" className="btn" onClick={next}>Next</button>}
      </div>
    </div>
  );
}
