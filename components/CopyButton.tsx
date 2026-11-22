"use client";
import { useState } from "react";

export function CopyButton({ text, label, className = "btn-ghost" }: { text: string; label: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={className}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
    >
      {done ? "Copied!" : label}
    </button>
  );
}
