export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function formatTime(iso: string | number): string {
  const d = typeof iso === 'number' ? new Date(iso) : new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatRelative(iso: string | number): string {
  const then = typeof iso === 'number' ? iso : new Date(iso).getTime();
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function orderTotal(items: { productPrice: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
}
