import clsx from 'clsx';
import { Zap } from 'lucide-react';
import type { CircuitBreaker } from '../lib/types';

const STATE_STYLE: Record<CircuitBreaker['state'], string> = {
  CLOSED: 'bg-emerald-500/15 text-emerald-500 ring-emerald-500/30',
  HALF_OPEN: 'bg-amber-glow/15 text-amber-glow ring-amber-glow/30',
  OPEN: 'bg-rose-glow/15 text-rose-glow ring-rose-glow/30',
};

export function CircuitBreakerPanel({ breakers }: { breakers: CircuitBreaker[] }) {
  return (
    <div className="card rounded-2xl p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Zap size={15} className="text-accent-500" /> Circuit breakers
      </h3>
      {breakers.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          Circuit state isn't exposed through this console in live mode — Resilience4j
          publishes it at{' '}
          <span className="font-mono text-xs">/actuator/circuitbreakers</span> on
          catalog-service (:8181), with the event stream at{' '}
          <span className="font-mono text-xs">/actuator/circuitbreakerevents</span>.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {breakers.map((cb) => (
            <li key={cb.name} className="flex items-center justify-between rounded-xl bg-[var(--bg-inset)] px-3 py-2">
              <div>
                <p className="text-xs font-medium">{cb.name}</p>
                <p className="text-[11px] text-[var(--text-muted)]">error rate {cb.errorRate.toFixed(1)}%</p>
              </div>
              <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset', STATE_STYLE[cb.state])}>
                {cb.state}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
