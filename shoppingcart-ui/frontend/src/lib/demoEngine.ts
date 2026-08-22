import type {
  CircuitBreaker,
  Order,
  OrderItem,
  OrderMetrics,
  Product,
  ServiceNode,
  TickerEvent,
} from './types';

/**
 * Simulates the DOMS backend for the GitHub Pages demo build, so the
 * console is fully interactive with zero infrastructure. Mirrors the real
 * order-service lifecycle logic (30% transient-failure rate, Spring Retry
 * with 3 attempts, Hystrix fallback on the catalog->inventory call) so the
 * demo tells the same story the real system does.
 */

const PRODUCTS: Product[] = [
  { id: 1, code: 'P001', name: 'Aurora Wireless Headphones', description: 'Active noise-cancelling, 40h battery', price: 129.99, inStock: true },
  { id: 2, code: 'P002', name: 'Nimbus Mechanical Keyboard', description: 'Hot-swappable switches, aluminium frame', price: 149.0, inStock: true },
  { id: 3, code: 'P003', name: 'Orbit Smart Watch', description: 'Health tracking, 7-day battery', price: 199.5, inStock: true },
  { id: 4, code: 'P004', name: 'Solace Desk Lamp', description: 'Adaptive warm/cool LED, USB-C', price: 42.0, inStock: true },
  { id: 5, code: 'P005', name: 'Voyager Travel Backpack', description: '30L, weatherproof shell', price: 89.99, inStock: true },
  { id: 6, code: 'P006', name: 'Pulse Fitness Tracker', description: 'Heart-rate + SpO2, 10-day battery', price: 59.0, inStock: false },
  { id: 7, code: 'P007', name: 'Halo Desk Monitor Light', description: 'Screen-mounted, auto-dimming', price: 54.5, inStock: true },
  { id: 8, code: 'P008', name: 'Ember Insulated Bottle', description: '24h cold / 12h hot, 750ml', price: 28.0, inStock: true },
];

const TOPOLOGY: ServiceNode[] = [
  { id: 'ui', label: 'shoppingcart-ui', role: 'Edge Gateway (Zuul) + SPA host', state: 'UP', port: 8080, x: 50, y: 8 },
  { id: 'registry', label: 'service-registry', role: 'Eureka discovery', state: 'UP', port: 8761, x: 18, y: 30 },
  { id: 'config', label: 'config-server', role: 'Centralized config', state: 'UP', port: 8888, x: 82, y: 30 },
  { id: 'order', label: 'order-service', role: 'Order lifecycle + retry', state: 'UP', port: 8383, x: 25, y: 58 },
  { id: 'catalog', label: 'catalog-service', role: 'Product catalog', state: 'UP', port: 8181, x: 50, y: 58 },
  { id: 'inventory', label: 'inventory-service', role: 'Stock levels', state: 'UP', port: 8282, x: 75, y: 58 },
  { id: 'oauth2', label: 'oauth2-server', role: 'Auth server', state: 'UP', port: 8901, x: 12, y: 84 },
  { id: 'zipkin', label: 'zipkin', role: 'Distributed tracing', state: 'UP', port: 9411, x: 62, y: 84 },
];

const EDGES: [string, string][] = [
  ['ui', 'order'],
  ['ui', 'catalog'],
  ['ui', 'inventory'],
  ['order', 'registry'],
  ['catalog', 'registry'],
  ['inventory', 'registry'],
  ['catalog', 'inventory'],
  ['order', 'config'],
  ['catalog', 'config'],
  ['inventory', 'config'],
];

type Listener = () => void;

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

class DemoEngine {
  private products = PRODUCTS;
  private orders = new Map<number, Order>();
  private nextOrderId = 1042;
  private metrics: OrderMetrics = { total_orders: 187, failed_orders: 11, success_orders: 176, success_rate: '94.12%' };
  private topology: ServiceNode[] = TOPOLOGY.map((n) => ({ ...n }));
  private circuitBreakers: CircuitBreaker[] = [
    { name: 'catalog-service -> inventory-service', from: 'catalog', to: 'inventory', state: 'CLOSED', errorRate: 2 },
    { name: 'order-service -> order DB', from: 'order', to: 'order', state: 'CLOSED', errorRate: 4 },
  ];
  private ticker: TickerEvent[] = [];
  private listeners = new Set<Listener>();
  private customers = ['ava@brightpath.io', 'noah@cirrus.dev', 'mia@fernwood.co', 'liam@quartzlab.com', 'zoe@harbortech.io'];

  constructor() {
    this.pushTicker('info', 'Demo engine initialized — simulating 9 services');
    setInterval(() => this.ambientTick(), 3800);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private pushTicker(level: TickerEvent['level'], message: string) {
    this.ticker = [{ id: uid(), ts: Date.now(), message, level }, ...this.ticker].slice(0, 60);
  }

  getProducts(): Product[] {
    return this.products;
  }

  getProduct(code: string): Product | undefined {
    return this.products.find((p) => p.code === code);
  }

  getOrder(id: number): Order | undefined {
    return this.orders.get(id);
  }

  getMetrics(): OrderMetrics {
    return this.metrics;
  }

  getTopology(): ServiceNode[] {
    return this.topology;
  }

  getEdges() {
    return EDGES;
  }

  getCircuitBreakers(): CircuitBreaker[] {
    return this.circuitBreakers;
  }

  getTicker(): TickerEvent[] {
    return this.ticker;
  }

  createOrder(customerEmail: string, customerAddress: string, items: OrderItem[]): Order {
    const id = this.nextOrderId++;
    const now = new Date().toISOString();
    const order: Order = {
      id,
      customerEmail,
      customerAddress,
      status: 'CREATED',
      createdAt: now,
      updatedAt: now,
      items,
    };
    this.orders.set(id, order);
    this.metrics = { ...this.metrics, total_orders: this.metrics.total_orders + 1 };
    this.pushTicker('info', `order-service: created order #${id} for ${customerEmail}`);
    this.notify();
    this.runLifecycle(id);
    return order;
  }

  private updateOrder(id: number, patch: Partial<Order>) {
    const existing = this.orders.get(id);
    if (!existing) return;
    this.orders.set(id, { ...existing, ...patch, updatedAt: new Date().toISOString() });
    this.notify();
  }

  private runLifecycle(id: number, attempt = 1) {
    setTimeout(() => {
      this.pushTicker('info', `order-service: processing order #${id} (attempt ${attempt}/3)`);
      this.updateOrder(id, { status: 'PROCESSING' });

      const failed = Math.random() < 0.3;
      setTimeout(() => {
        if (failed && attempt < 3) {
          this.pushTicker('warn', `order-service: transient failure on order #${id}, retrying with backoff`);
          this.runLifecycle(id, attempt + 1);
          return;
        }
        if (failed) {
          this.pushTicker('error', `order-service: order #${id} moved to FAILED after ${attempt} attempts`);
          this.updateOrder(id, { status: 'FAILED' });
          this.metrics = {
            ...this.metrics,
            failed_orders: this.metrics.failed_orders + 1,
            success_rate: this.rate(this.metrics.success_orders, this.metrics.failed_orders + 1),
          };
          this.notify();
          return;
        }
        this.pushTicker('success', `order-service: order #${id} SHIPPED`);
        this.updateOrder(id, { status: 'SHIPPED' });
        this.metrics = {
          ...this.metrics,
          success_orders: this.metrics.success_orders + 1,
          success_rate: this.rate(this.metrics.success_orders + 1, this.metrics.failed_orders),
        };
        this.notify();

        setTimeout(() => {
          this.pushTicker('success', `order-service: order #${id} DELIVERED`);
          this.updateOrder(id, { status: 'DELIVERED' });
        }, 4000 + Math.random() * 3000);
      }, 1400 + Math.random() * 900);
    }, 900 + Math.random() * 600);
  }

  private rate(success: number, failed: number): string {
    const total = success + failed;
    return total > 0 ? `${((success / total) * 100).toFixed(2)}%` : '0.00%';
  }

  private ambientTick() {
    // Occasionally trip the catalog->inventory circuit breaker, matching
    // the real @HystrixCommand fallback in InventoryServiceClient.
    if (Math.random() < 0.12) {
      const cb = this.circuitBreakers[0];
      cb.state = cb.state === 'CLOSED' ? 'OPEN' : 'CLOSED';
      cb.errorRate = cb.state === 'OPEN' ? 45 + Math.random() * 20 : 1 + Math.random() * 4;
      this.pushTicker(
        cb.state === 'OPEN' ? 'error' : 'success',
        cb.state === 'OPEN'
          ? 'resilience4j: circuit OPEN for catalog-service -> inventory-service, serving fallback'
          : 'resilience4j: circuit CLOSED for catalog-service -> inventory-service, recovered',
      );
      const invNode = this.topology.find((n) => n.id === 'inventory');
      if (invNode) invNode.state = cb.state === 'OPEN' ? 'DEGRADED' : 'UP';
      this.notify();
    }

    // Ambient background orders so the console feels alive when idle.
    if (Math.random() < 0.35) {
      const email = this.customers[Math.floor(Math.random() * this.customers.length)];
      const item: OrderItem = {
        productId: this.products[Math.floor(Math.random() * this.products.length)].id,
        quantity: 1 + Math.floor(Math.random() * 3),
        productPrice: this.products[Math.floor(Math.random() * this.products.length)].price,
      };
      this.createOrder(email, '—', [item]);
    } else {
      this.notify();
    }
  }
}

export const demoEngine = new DemoEngine();
