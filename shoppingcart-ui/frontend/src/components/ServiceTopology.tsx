import type { ServiceNode } from '../lib/types';
import { ServiceDot } from './StatusBadge';

export function ServiceTopology({ nodes, edges }: { nodes: ServiceNode[]; edges: [string, string][] }) {
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-inset)]">
      <div className="grid-fade absolute inset-0" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map(([a, b]) => {
          const from = byId.get(a);
          const to = byId.get(b);
          if (!from || !to) return null;
          const degraded = from.state !== 'UP' || to.state !== 'UP';
          return (
            <line
              key={`${a}-${b}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              vectorEffect="non-scaling-stroke"
              className="flow-line"
              stroke={degraded ? 'var(--color-rose-glow)' : 'var(--color-accent-400)'}
              strokeWidth={1.5}
              opacity={degraded ? 0.7 : 0.45}
            />
          );
        })}
      </svg>

      {nodes.map((node) => (
        <div
          key={node.id}
          className="card absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-xl px-3 py-2 text-center shadow-sm"
          style={{ left: `${node.x}%`, top: `${node.y}%`, minWidth: 128 }}
        >
          <div className="flex items-center gap-1.5">
            <ServiceDot state={node.state} />
            <span className="text-xs font-semibold">{node.label}</span>
          </div>
          <span className="text-[10px] leading-tight text-[var(--text-muted)]">{node.role}</span>
          <span className="font-mono text-[9px] text-[var(--text-muted)]">:{node.port}</span>
        </div>
      ))}
    </div>
  );
}
