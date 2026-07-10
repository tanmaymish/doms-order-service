import { motion } from 'framer-motion';
import { Check, PackageCheck, Send, ShoppingBag, Truck, X } from 'lucide-react';
import type { OrderStatus } from '../lib/types';

const HAPPY_PATH: { key: OrderStatus; label: string; icon: typeof Check }[] = [
  { key: 'CREATED', label: 'Order created', icon: ShoppingBag },
  { key: 'PROCESSING', label: 'Processing (retryable)', icon: Send },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: PackageCheck },
];

const ORDER: OrderStatus[] = ['CREATED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export function OrderTimeline({ status }: { status: OrderStatus }) {
  const failed = status === 'FAILED';
  const currentIndex = failed ? 1 : ORDER.indexOf(status);

  return (
    <ol className="flex flex-col gap-0">
      {HAPPY_PATH.map((step, i) => {
        const isFailedHere = failed && i === 1;
        const done = !failed && i < currentIndex;
        const active = !failed && i === currentIndex;
        const Icon = isFailedHere ? X : step.icon;

        return (
          <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
            {i < HAPPY_PATH.length - 1 && (
              <span
                className="absolute left-[15px] top-8 h-full w-0.5"
                style={{
                  background: done || active ? 'var(--color-accent-500)' : 'var(--border)',
                  opacity: isFailedHere ? 0.3 : 1,
                }}
              />
            )}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4"
              style={{
                background: isFailedHere ? 'var(--color-rose-glow)' : done || active ? 'var(--color-accent-500)' : 'var(--bg-inset)',
                color: isFailedHere || done || active ? 'white' : 'var(--text-muted)',
                ['--tw-ring-color' as string]: 'var(--bg)',
              }}
            >
              {active && !isFailedHere ? (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-50" />
              ) : null}
              <Icon size={15} className="relative" />
            </motion.div>
            <div className="pt-1">
              <p className={`text-sm font-medium ${done || active || isFailedHere ? '' : 'text-[var(--text-muted)]'}`}>
                {isFailedHere ? 'Processing failed — max retries exhausted' : step.label}
              </p>
              {active && !isFailedHere && <p className="text-xs text-[var(--text-muted)]">In progress…</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
