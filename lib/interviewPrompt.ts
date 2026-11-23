/** Prompt a person pastes into their own Claude/Muse chat to talk through what they want; the chat ends with JSON that fills the profile form. */
export function buildInterviewPrompt(resume: string): string {
  return `I'm looking for a new job and want you to help me work out exactly what I'm looking for. Interview me, then give me a summary I can paste into my job-search app.

How to do it:
- Ask ONE question at a time, in a friendly tone, and wait for my answer. Use my resume (below) so you don't ask what it already tells you.
- Cover: the kind of work and setting I want, and what I want to get away from; schedule or shifts; pay (convert hourly to a yearly number for me); where I'd work and how far I'd commute, or whether remote or hybrid; seniority; any licenses or certifications to keep using; things the job must have; and deal-breakers. Finish by asking if there's anything else.
- Ask follow-ups when an answer is vague. Aim for roughly 6 to 10 questions in total.
- When you have enough, show me a short plain-English summary and ask if it's right. After I confirm, reply with ONLY this JSON in one code block, and nothing else:

{"full_name":"","headline":"short title line like 'Registered nurse, 6 years'","target_titles":["job titles to search for, 3 to 6"],"seniority":["any of: entry, mid, senior, lead, manager, director, executive"],"work_modes":["any of: remote, hybrid, onsite"],"locations":["cities or regions"],"min_salary":0,"industries":["settings or industries, or empty"],"must_haves":"one or two sentences","deal_breakers":"one or two sentences"}

Use null for min_salary if I didn't give one.

MY RESUME
${resume.slice(0, 12000)}`;
}
