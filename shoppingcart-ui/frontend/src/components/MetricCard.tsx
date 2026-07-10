import type { LucideIcon } from 'lucide-react';

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = 'accent',
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'accent' | 'emerald' | 'rose' | 'amber';
  hint?: string;
}) {
  const toneClass = {
    accent: 'text-accent-500 bg-accent-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    rose: 'text-rose-glow bg-rose-glow/10',
    amber: 'text-amber-glow bg-amber-glow/10',
  }[tone];

  return (
    <div className="card flex items-center gap-3 rounded-2xl p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
        <Icon size={19} />
      </div>
      <div>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="text-xl font-semibold leading-tight">{value}</p>
        {hint && <p className="text-[11px] text-[var(--text-muted)]">{hint}</p>}
      </div>
    </div>
  );
}
