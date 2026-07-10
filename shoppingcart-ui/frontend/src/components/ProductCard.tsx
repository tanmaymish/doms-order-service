import { motion } from 'framer-motion';
import { Package, Plus } from 'lucide-react';
import type { Product } from '../lib/types';
import { formatCurrency } from '../lib/format';
import { useCart } from '../context/CartContext';

const GRADIENTS = [
  'from-accent-500/25 to-cyan-glow/10',
  'from-cyan-glow/20 to-accent-500/10',
  'from-amber-glow/20 to-accent-500/10',
  'from-rose-glow/15 to-accent-500/10',
];

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const { addItem } = useCart();
  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card group flex flex-col overflow-hidden rounded-2xl"
    >
      <div className={`flex h-32 items-center justify-center bg-gradient-to-br ${gradient}`}>
        <Package className="text-[var(--text)] opacity-40" size={40} strokeWidth={1.25} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-snug">{product.name}</h3>
          <span className="shrink-0 rounded-md bg-[var(--bg-inset)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
            {product.code}
          </span>
        </div>
        <p className="text-sm text-[var(--text-muted)]">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-semibold">{formatCurrency(product.price)}</span>
          {product.inStock ? (
            <button
              onClick={() => addItem(product)}
              className="flex items-center gap-1 rounded-lg bg-accent-500 px-3 py-1.5 text-sm font-medium text-white transition-transform active:scale-95 hover:bg-accent-600"
            >
              <Plus size={14} /> Add
            </button>
          ) : (
            <span className="rounded-lg bg-[var(--bg-inset)] px-3 py-1.5 text-sm text-[var(--text-muted)]">Out of stock</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
