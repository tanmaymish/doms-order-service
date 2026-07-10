import { demoEngine } from './demoEngine';
import type { CircuitBreaker, Order, OrderItem, OrderMetrics, Product, ServiceNode, TickerEvent } from './types';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// In production this is served by shoppingcart-ui itself (the Zuul edge
// gateway) at the same origin, context-path /ui. In dev, vite.config.ts
// proxies /ui/api to the gateway on :8080.
const GATEWAY = '/ui/api';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function getProducts(): Promise<Product[]> {
  if (DEMO_MODE) return Promise.resolve(demoEngine.getProducts());
  const res = await fetch(`${GATEWAY}/catalog-service/api/products`);
  const products = await json<Product[]>(res);
  return products.map((p) => ({ ...p, inStock: p.inStock ?? true }));
}

export async function createOrder(customerEmail: string, customerAddress: string, items: OrderItem[]): Promise<Order> {
  if (DEMO_MODE) return Promise.resolve(demoEngine.createOrder(customerEmail, customerAddress, items));
  const res = await fetch(`${GATEWAY}/order-service/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerEmail, customerAddress, items }),
  });
  return json<Order>(res);
}

export async function getOrder(id: number): Promise<Order | undefined> {
  if (DEMO_MODE) return Promise.resolve(demoEngine.getOrder(id));
  const res = await fetch(`${GATEWAY}/order-service/api/orders/${id}`);
  if (res.status === 404) return undefined;
  return json<Order>(res);
}

export async function getMetrics(): Promise<OrderMetrics> {
  if (DEMO_MODE) return Promise.resolve(demoEngine.getMetrics());
  const res = await fetch(`${GATEWAY}/order-service/api/metrics/orders`);
  return json<OrderMetrics>(res);
}

const REAL_SERVICES: Omit<ServiceNode, 'state'>[] = demoEngine.getTopology().map(({ state: _state, ...rest }) => rest);

export async function getServiceTopology(): Promise<ServiceNode[]> {
  if (DEMO_MODE) return Promise.resolve(demoEngine.getTopology());
  const checks = await Promise.all(
    REAL_SERVICES.map(async (svc) => {
      try {
        // The gateway (shoppingcart-ui) can check its own health directly;
        // every other service is reached through its Zuul-proxied route.
        const url = svc.id === 'ui' ? '/ui/actuator/health' : `${GATEWAY}/${svc.label}/actuator/health`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) return { ...svc, state: 'DOWN' as const };
        const body = await res.json();
        return { ...svc, state: (body.status === 'UP' ? 'UP' : 'DEGRADED') as ServiceNode['state'] };
      } catch {
        return { ...svc, state: 'DOWN' as const };
      }
    }),
  );
  return checks;
}

export function getEdges() {
  return demoEngine.getEdges();
}

export function getCircuitBreakers(): CircuitBreaker[] {
  return DEMO_MODE ? demoEngine.getCircuitBreakers() : [];
}

export function getTicker(): TickerEvent[] {
  return DEMO_MODE ? demoEngine.getTicker() : [];
}

export function subscribeDemo(fn: () => void): () => void {
  if (!DEMO_MODE) return () => {};
  return demoEngine.subscribe(fn);
}
