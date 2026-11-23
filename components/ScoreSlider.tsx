"use client";
import { useState } from "react";
import { Score } from "./Score";

const blurb = (v: number) =>
  v < 60 ? "Wide net. You'll see long shots and maybes along with the good ones."
  : v < 78 ? "Balanced. Solid fits plus a few stretch roles worth a look."
  : v < 90 ? "Selective. Only strong fits, so expect fewer jobs each day."
  : "Very picky. You may see nothing on slow days.";

export function ScoreSlider({ defaultValue }: { defaultValue: number }) {
  const [v, setV] = useState(defaultValue);
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="w-24 shrink-0"><Score score={v} size="lg" /></div>
      <div className="flex-1">
        <input type="range" name="min_score" min={30} max={95} step={5} value={v} onChange={(e) => setV(Number(e.target.value))} className="w-full accent-[var(--color-brand)]" aria-label="Minimum match score" />
        <p className="hint mt-1">{blurb(v)}</p>
      </div>
    </div>
  );
}
