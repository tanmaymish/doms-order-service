import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../lib/format';
import { createOrder } from '../lib/api';
import type { OrderItem } from '../lib/types';

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, setQuantity, removeItem, clear, totalPrice, totalItems } = useCart();
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function placeOrder() {
    if (!email || lines.length === 0) return;
    setPlacing(true);
    setError(null);
    try {
      const items: OrderItem[] = lines.map((l) => ({
        productId: l.product.id,
        quantity: l.quantity,
        productPrice: l.product.price,
        productName: l.product.name,
      }));
      const order = await createOrder(email, address || 'Not provided', items);
      clear();
      onClose();
      navigate(`/orders/${order.id}`);
    } catch {
      setError('Could not reach order-service. Is the gateway running?');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="card fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
              <h2 className="flex items-center gap-2 font-semibold">
                <ShoppingBag size={18} /> Your Cart ({totalItems})
              </h2>
              <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-[var(--bg-inset)]">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {lines.length === 0 ? (
                <p className="mt-12 text-center text-sm text-[var(--text-muted)]">Your cart is empty — add something from the storefront.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {lines.map((line) => (
                    <li key={line.product.id} className="flex items-center gap-3 rounded-xl bg-[var(--bg-inset)] p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{line.product.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{formatCurrency(line.product.price)} each</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setQuantity(line.product.id, line.quantity - 1)}
                          className="rounded-md p-1 hover:bg-[var(--bg-elevated)]"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-5 text-center text-sm">{line.quantity}</span>
                        <button
                          onClick={() => setQuantity(line.product.id, line.quantity + 1)}
                          className="rounded-md p-1 hover:bg-[var(--bg-elevated)]"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button onClick={() => removeItem(line.product.id)} className="rounded-md p-1.5 text-rose-glow hover:bg-rose-glow/10">
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <div className="border-t border-[var(--border)] p-4">
                <div className="mb-3 flex flex-col gap-2">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Customer email"
                    type="email"
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-accent-500"
                  />
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Shipping address"
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-accent-500"
                  />
                </div>
                {error && <p className="mb-2 text-xs text-rose-glow">{error}</p>}
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Total</span>
                  <span className="text-lg font-semibold">{formatCurrency(totalPrice)}</span>
                </div>
                <button
                  disabled={!email || placing}
                  onClick={placeOrder}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-500 py-2.5 font-medium text-white transition-transform active:scale-[0.98] hover:bg-accent-600 disabled:opacity-50"
                >
                  {placing && <Loader2 size={16} className="animate-spin" />}
                  {placing ? 'Placing order…' : 'Place order'}
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
