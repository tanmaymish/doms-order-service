import clsx from 'clsx';
import { Terminal } from 'lucide-react';
import type { TickerEvent } from '../lib/types';
import { formatTime } from '../lib/format';

const LEVEL_COLOR: Record<TickerEvent['level'], string> = {
  info: 'text-[var(--text-muted)]',
  success: 'text-emerald-500',
  warn: 'text-amber-glow',
  error: 'text-rose-glow',
};

export function LiveTicker({ events }: { events: TickerEvent[] }) {
  return (
    <div className="card flex h-full flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <Terminal size={15} className="text-accent-500" />
        <h3 className="text-sm font-semibold">Live event stream</h3>
        <span className="ml-auto flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-3 font-mono text-[11.5px] leading-relaxed">
        {events.length === 0 && <p className="p-2 text-[var(--text-muted)]">Waiting for events…</p>}
        {events.map((e) => (
          <div key={e.id} className="ticker-row flex gap-2">
            <span className="shrink-0 text-[var(--text-muted)]">{formatTime(e.ts)}</span>
            <span className={clsx(LEVEL_COLOR[e.level])}>{e.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
