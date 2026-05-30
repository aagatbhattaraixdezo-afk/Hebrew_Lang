import { Flame, Sparkles } from "lucide-react";

export function StreakBadge({ count }: { count: number }) {
  const active = count > 0;
  return (
    <div className="flex items-center gap-2 rounded-full bg-surface border border-border/70 px-3.5 py-1.5 shadow-soft">
      <Flame
        className={
          active
            ? "h-4 w-4 text-flame animate-flame"
            : "h-4 w-4 text-muted/60"
        }
        fill={active ? "currentColor" : "none"}
      />
      <span className="text-sm font-semibold text-ink">{count}</span>
      <span className="text-xs text-muted">day{count === 1 ? "" : "s"}</span>
    </div>
  );
}

export function XpBadge({ xp }: { xp: number }) {
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  return (
    <div className="flex items-center gap-2 rounded-full bg-surface border border-border/70 px-3.5 py-1.5 shadow-soft">
      <Sparkles className="h-4 w-4 text-accent" />
      <span className="text-sm font-semibold text-ink">{xp} XP</span>
      <span className="text-xs text-muted">Lv {level}</span>
    </div>
  );
}

export function XpRing({ xp, size = 96 }: { xp: number; size?: number }) {
  const into = xp % 100;
  const pct = into / 100;
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const level = Math.floor(xp / 100) + 1;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="hsl(var(--border))"
          strokeWidth={8}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="hsl(var(--accent))"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs uppercase tracking-widest text-muted">Lv</span>
        <span className="text-2xl font-bold text-ink">{level}</span>
      </div>
    </div>
  );
}
