import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Search } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { getProducts } from '../lib/api';
import type { Product } from '../lib/types';

const BADGES = ['Spring Boot 2', 'Spring Cloud (Eureka + Zuul + Hystrix)', 'Spring Retry', 'React 19 + TS', 'Docker Compose'];

export function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card relative mb-8 overflow-hidden rounded-2xl p-6 sm:p-8"
      >
        <div className="grid-fade absolute inset-0 opacity-60" />
        <div className="relative">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-500">Distributed Order Management System</p>
          <h1 className="max-w-xl text-2xl font-semibold leading-tight sm:text-3xl">A real Spring Cloud microservices platform, in the browser.</h1>
          <p className="mt-3 max-w-xl text-sm text-[var(--text-muted)]">
            Every order placed here flows through the same edge gateway, service discovery, retry, and circuit-breaker
            logic as the deployed system — check the <a href="/control-tower" className="text-accent-500 underline underline-offset-2">Control Tower</a> to
            watch it happen live.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {BADGES.map((b) => (
              <span key={b} className="rounded-full bg-[var(--bg-inset)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
                {b}
              </span>
            ))}
          </div>
          <a
            href="https://github.com/tanmaymish/doms-order-service"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-500 hover:underline"
          >
            <Code2 size={15} /> View source & architecture
          </a>
        </div>
      </motion.section>

      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Catalog</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] py-1.5 pl-8 pr-3 text-sm outline-none focus:border-accent-500"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-glow/10 p-4 text-sm text-rose-glow">
          Couldn't reach catalog-service through the gateway. If you're running this locally, start the stack with{' '}
          <code className="font-mono">./run.sh start_all</code>.
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-64 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
