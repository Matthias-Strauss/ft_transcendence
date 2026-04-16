interface AuthShowcaseProps {
  description: string;
  footer: string;
  badges?: string[];
}

const defaultBadges = ['Play online', 'Live chat', 'Posts & likes'];
const netSegments = Array.from({ length: 8 });
const sceneStats = [
  { label: 'Queue', value: 'Open' },
  { label: 'Latency', value: '32ms' },
  { label: 'Players', value: '128' },
];

export function AuthShowcase({ description, footer, badges = defaultBadges }: AuthShowcaseProps) {
  return (
    <div className="auth-enter auth-enter-delay-1 flex flex-col justify-center gap-6 bg-slate-900/60 p-8 text-center sm:p-10 lg:p-12">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300/80">
          ft_transcendence
        </p>
        <div className="text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl">
          Transcendence
        </div>
        <p className="mx-auto max-w-md text-sm leading-6 text-slate-300 sm:text-base">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {badges.map((badge, index) => (
          <span
            key={badge}
            className="auth-badge rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200"
            style={{ animationDelay: `${index * 180}ms` }}
          >
            {badge}
          </span>
        ))}
      </div>

      <div className="auth-enter auth-enter-delay-2 relative mx-auto w-full max-w-md">
        <div className="auth-ambient absolute inset-6 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="auth-ambient auth-ambient-delayed absolute inset-x-10 bottom-0 top-12 rounded-full bg-pink-500/10 blur-3xl" />
        <div className="auth-showcase-card relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/80 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.45)]">
          <div className="auth-gradient-sweep pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_35%),radial-gradient(circle_at_bottom,rgba(236,72,153,0.12),transparent_42%)]" />

          <div className="auth-match-stage relative h-44 overflow-hidden rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.92))]">
            <div className="auth-arena-grid absolute inset-0 opacity-70" />
            <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-200/85">
              <span className="auth-signal-dot size-2 rounded-full bg-emerald-300" />
              Live
            </div>
            <div className="absolute inset-x-4 top-4 flex items-center justify-between pr-20 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
              <span>P1</span>
              <span>Live Match</span>
              <span>P2</span>
            </div>

            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-5 text-3xl font-black text-white/90">
              <span>4</span>
              <span className="text-slate-600">:</span>
              <span>2</span>
            </div>

            <div className="absolute inset-y-5 left-1/2 flex -translate-x-1/2 flex-col justify-between">
              {netSegments.map((_, index) => (
                <span key={index} className="h-3 w-1 rounded-full bg-white/25" />
              ))}
            </div>

            <div className="auth-hit-spark auth-hit-spark-left-mid absolute left-5 top-[54%] size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-200/50" />
            <div className="auth-hit-spark auth-hit-spark-left-low absolute left-5 top-[66%] size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-200/50" />
            <div className="auth-hit-spark auth-hit-spark-right-high absolute right-5 top-[38%] size-10 translate-x-1/2 -translate-y-1/2 rounded-full border border-pink-200/50" />
            <div className="auth-hit-spark auth-hit-spark-right-mid absolute right-5 top-[52%] size-10 translate-x-1/2 -translate-y-1/2 rounded-full border border-pink-200/50" />
            <div className="auth-paddle-left absolute left-4 top-[58%] h-14 w-2 -translate-y-1/2 rounded-full bg-sky-200 shadow-[0_0_24px_rgba(125,211,252,0.35)]" />
            <div className="auth-paddle-right absolute right-4 top-[40%] h-14 w-2 -translate-y-1/2 rounded-full bg-pink-200 shadow-[0_0_24px_rgba(244,114,182,0.28)]" />
            <div className="auth-ball-trail absolute left-[46%] top-[43%] h-3 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/35 blur-md" />
            <div className="auth-ball absolute left-[46%] top-[43%] size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,0.55)]" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.72))]" />
          </div>

          <div className="relative mt-4 grid gap-3 sm:grid-cols-3">
            {sceneStats.map((item, index) => (
              <div
                key={item.label}
                className="auth-enter rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-left"
                style={{ animationDelay: `${240 + index * 120}ms` }}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                  {item.label}
                </div>
                <div className="mt-1 text-sm font-semibold text-white sm:text-base">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-left">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              Match mode
            </div>
            <div className="mt-1 text-sm font-semibold text-white sm:text-base">
              Quick duel with chat and profile sync
            </div>
          </div>
        </div>
      </div>

      <div className="auth-enter auth-enter-delay-3 text-sm font-medium text-slate-400 sm:text-[15px]">
        {footer}
      </div>
    </div>
  );
}
