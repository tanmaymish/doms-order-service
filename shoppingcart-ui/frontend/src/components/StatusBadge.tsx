import clsx from 'clsx';
import type { OrderStatus, ServiceState } from '../lib/types';

const ORDER_STYLES: Record<OrderStatus, string> = {
  CREATED: 'bg-slate-500/15 text-slate-500 dark:text-slate-300 ring-slate-500/30',
  PROCESSING: 'bg-amber-glow/15 text-amber-600 dark:text-amber-glow ring-amber-glow/30',
  SHIPPED: 'bg-accent-500/15 text-accent-600 dark:text-accent-300 ring-accent-500/30',
  DELIVERED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30',
  FAILED: 'bg-rose-glow/15 text-rose-600 dark:text-rose-glow ring-rose-glow/30',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset', ORDER_STYLES[status])}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', {
        'bg-slate-400': status === 'CREATED',
        'bg-amber-glow animate-pulse': status === 'PROCESSING',
        'bg-accent-500': status === 'SHIPPED',
        'bg-emerald-500': status === 'DELIVERED',
        'bg-rose-glow': status === 'FAILED',
      })} />
      {status}
    </span>
  );
}

const SERVICE_STYLES: Record<ServiceState, string> = {
  UP: 'bg-emerald-500',
  DEGRADED: 'bg-amber-glow',
  DOWN: 'bg-rose-glow',
};

export function ServiceDot({ state }: { state: ServiceState }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {state !== 'DOWN' && (
        <span className={clsx('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', SERVICE_STYLES[state])} />
      )}
      <span className={clsx('relative inline-flex h-2.5 w-2.5 rounded-full', SERVICE_STYLES[state])} />
    </span>
  );
}
