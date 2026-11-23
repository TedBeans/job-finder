const tone = (s: number) => (s >= 85 ? "text-brand" : s >= 70 ? "text-ink" : "text-warn");
const size = { md: "text-[34px]", lg: "text-[56px]", xl: "text-[120px] sm:text-[148px]" };

/** The match score: the one number the whole app is organised around. */
export function Score({ score, size: sz = "md", className = "", plain = false }: { score: number; size?: keyof typeof size; className?: string; plain?: boolean }) {
  return (
    <span aria-label={`Match score ${score} out of 100`} className={`font-display font-extrabold leading-none tabular-nums tracking-tight ${size[sz]} ${plain ? "" : tone(score)} ${className}`}>
      {score}
    </span>
  );
}
