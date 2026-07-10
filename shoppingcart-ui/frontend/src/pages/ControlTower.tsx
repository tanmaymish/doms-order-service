import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, PackageX, RadioTower, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ServiceTopology } from '../components/ServiceTopology';
import { MetricCard } from '../components/MetricCard';
import { LiveTicker } from '../components/LiveTicker';
import { CircuitBreakerPanel } from '../components/CircuitBreakerPanel';
import { DEMO_MODE, getCircuitBreakers, getEdges, getMetrics, getServiceTopology, getTicker, subscribeDemo } from '../lib/api';
import type { CircuitBreaker, OrderMetrics, ServiceNode, TickerEvent } from '../lib/types';

interface HistoryPoint {
  t: number;
  total: number;
}

export function ControlTower() {
  const [nodes, setNodes] = useState<ServiceNode[]>([]);
  const [metrics, setMetrics] = useState<OrderMetrics | null>(null);
  const [breakers, setBreakers] = useState<CircuitBreaker[]>([]);
  const [ticker, setTicker] = useState<TickerEvent[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    const refresh = () => {
      getServiceTopology().then(setNodes);
      getMetrics().then((m) => {
        setMetrics(m);
        setHistory((prev) => [...prev, { t: Date.now(), total: m.total_orders }].slice(-40));
      });
      setBreakers(getCircuitBreakers());
      setTicker(getTicker());
    };

    refresh();

    if (DEMO_MODE) {
      return subscribeDemo(refresh);
    }
    const interval = setInterval(refresh, 4000);
    return () => clearInterval(interval);
  }, []);

  const upCount = nodes.filter((n) => n.state === 'UP').length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <RadioTower size={18} className="text-accent-500" />
        <h1 className="text-lg font-semibold">Control Tower</h1>
        <span className="text-sm text-[var(--text-muted)]">— live view of the DOMS service mesh</span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Services healthy" value={`${upCount}/${nodes.length || 9}`} icon={Activity} tone="accent" />
        <MetricCard label="Total orders" value={metrics?.total_orders ?? '—'} icon={TrendingUp} tone="accent" />
        <MetricCard label="Success rate" value={metrics?.success_rate ?? '—'} icon={CheckCircle2} tone="emerald" />
        <MetricCard label="Failed orders" value={metrics?.failed_orders ?? '—'} icon={PackageX} tone="rose" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ServiceTopology nodes={nodes} edges={getEdges()} />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-2">
          <CircuitBreakerPanel breakers={breakers} />
          <div className="card flex-1 rounded-2xl p-4">
            <h3 className="mb-2 text-sm font-semibold">Order volume</h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent-500)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-accent-500)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" hide />
                  <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    labelFormatter={() => ''}
                    formatter={(v) => [v, 'orders']}
                  />
                  <Area type="monotone" dataKey="total" stroke="var(--color-accent-500)" strokeWidth={2} fill="url(#vol)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="h-72">
        <LiveTicker events={ticker} />
      </div>

      {!DEMO_MODE && (
        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          Connected to the live gateway — health is polled from each service's Actuator endpoint every 4s.
        </p>
      )}
    </div>
  );
}
