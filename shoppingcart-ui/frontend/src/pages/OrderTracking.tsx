import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { OrderTimeline } from '../components/OrderTimeline';
import { OrderStatusBadge } from '../components/StatusBadge';
import { DEMO_MODE, getOrder, subscribeDemo } from '../lib/api';
import { formatCurrency, formatTime, orderTotal } from '../lib/format';
import type { Order } from '../lib/types';

export function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | undefined>();
  const [notFound, setNotFound] = useState(false);
  const [searchValue, setSearchValue] = useState(id ?? '');

  useEffect(() => {
    if (!id) return;
    setNotFound(false);
    let cancelled = false;

    const load = () =>
      getOrder(Number(id)).then((o) => {
        if (cancelled) return;
        if (!o) setNotFound(true);
        setOrder(o);
      });

    load();

    if (DEMO_MODE) {
      return subscribeDemo(load);
    }
    const interval = setInterval(load, 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) navigate(`/orders/${searchValue.trim()}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Track an order by ID…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] py-2 pl-8 pr-3 text-sm outline-none focus:border-accent-500"
          />
        </div>
        <button type="submit" className="rounded-lg bg-accent-500 px-4 text-sm font-medium text-white hover:bg-accent-600">
          Track
        </button>
      </form>

      {!id && <p className="text-center text-sm text-[var(--text-muted)]">Enter an order ID above, or place an order from the storefront.</p>}

      {id && notFound && (
        <p className="rounded-xl bg-rose-glow/10 p-4 text-center text-sm text-rose-glow">Order #{id} was not found.</p>
      )}

      {order && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card rounded-2xl p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Order</p>
              <h1 className="text-xl font-semibold">#{order.id}</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{order.customerEmail}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <OrderTimeline status={order.status} />

          <div className="mt-6 border-t border-[var(--border)] pt-4">
            <h2 className="mb-2 text-sm font-semibold">Items</h2>
            <ul className="flex flex-col gap-1.5">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between text-sm text-[var(--text-muted)]">
                  <span>
                    {item.productName ?? `Product #${item.productId}`} × {item.quantity}
                  </span>
                  <span>{formatCurrency(item.productPrice * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between border-t border-[var(--border)] pt-2 text-sm font-semibold">
              <span>Total</span>
              <span>{formatCurrency(orderTotal(order.items))}</span>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-[var(--text-muted)]">
            Created {formatTime(order.createdAt)} · Last updated {formatTime(order.updatedAt)}
          </p>
        </motion.div>
      )}
    </div>
  );
}
