export type OrderStatus = 'CREATED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'FAILED';

export interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
  price: number;
  inStock: boolean;
}

export interface OrderItem {
  productId: number;
  quantity: number;
  productPrice: number;
  productName?: string;
}

export interface Order {
  id: number;
  customerEmail: string;
  customerAddress: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderMetrics {
  total_orders: number;
  failed_orders: number;
  success_orders: number;
  success_rate: string;
}

export type ServiceState = 'UP' | 'DEGRADED' | 'DOWN';

export interface ServiceNode {
  id: string;
  label: string;
  role: string;
  state: ServiceState;
  port: number;
  x: number;
  y: number;
}

export type CircuitState = 'CLOSED' | 'HALF_OPEN' | 'OPEN';

export interface CircuitBreaker {
  name: string;
  from: string;
  to: string;
  state: CircuitState;
  errorRate: number;
}

export interface TickerEvent {
  id: string;
  ts: number;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}
