import Anthropic from "@anthropic-ai/sdk";

export const claude = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const SMART = () => process.env.CLAUDE_MODEL_SMART || "claude-sonnet-5-5";
export const FAST = () => process.env.CLAUDE_MODEL_FAST || "claude-haiku-5-5";

export function textOf(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/** Pull the first JSON object/array out of a model reply (handles ``` fences). */
export function extractJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidates = [fenced?.[1], text].filter(Boolean) as string[];
  for (const c of candidates) {
    const start = c.search(/[\[{]/);
    if (start < 0) continue;
    for (let end = c.length; end > start; end--) {
      const ch = c[end - 1];
      if (ch !== "]" && ch !== "}") continue;
      try {
        return JSON.parse(c.slice(start, end)) as T;
      } catch {
        /* keep shrinking */
      }
    }
  }
  return null;
}
