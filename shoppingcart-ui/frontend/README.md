# DOMS Control Tower (frontend)

React + TypeScript + Tailwind console served by `shoppingcart-ui`, DOMS's
Zuul edge gateway. See the [repo root README](../../README.md) for the full
architecture — this file only covers frontend-specific dev notes.

## Commands

```bash
npm install
npm run dev       # http://localhost:5173, proxies /ui/api to localhost:8080
npm run lint       # oxlint
npm run build      # tsc -b && vite build
```

## Build modes

Controlled by env vars read in `vite.config.ts` / `src/lib/api.ts`:

| Var | Effect |
| --- | --- |
| `VITE_DEMO_MODE=true` | Fully client-side simulated backend (`src/lib/demoEngine.ts`), no gateway required. |
| `VITE_BASE_PATH` | Overrides the `/ui/` base, used by the GitHub Pages deploy to publish under `/doms-order-service/`. |
| `VITE_OUT_DIR` | Overrides the build output dir. Defaults to `../target/classes/static` so `mvn package` picks it up automatically. |

## Structure

- `src/lib/api.ts` — single entry point for all data access; branches on
  `DEMO_MODE` so components never know which mode they're in.
- `src/lib/demoEngine.ts` — in-memory simulated backend used by demo mode
  (order lifecycle, retry/failure rate, and circuit-breaker trips mirror the
  real Java services).
- `src/pages/` — Storefront (catalog + cart + checkout), OrderTracking,
  ControlTower (service topology, metrics, circuit breakers, live ticker).
