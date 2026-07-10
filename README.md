<div align="center">

# 📦 DOMS — Distributed Order Management System

<strong>A Spring Cloud microservices platform with a real-time React operations console.</strong>

[![CI/CD Pipeline](https://github.com/tanmaymish/doms-order-service/actions/workflows/ci.yml/badge.svg)](https://github.com/tanmaymish/doms-order-service/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Control_Tower-6366f1)](https://tanmaymish.github.io/doms-order-service/)
![Java](https://img.shields.io/badge/Java-8-orange)
![Spring Cloud](https://img.shields.io/badge/Spring_Cloud-Finchley-6DB33F)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![License](https://img.shields.io/badge/License-MIT-purple)

[**🌐 Live Demo**](https://tanmaymish.github.io/doms-order-service/) &nbsp;·&nbsp;
[**🏗 Architecture**](#-system-architecture) &nbsp;·&nbsp;
[**🚀 Run it locally**](#-running-locally) &nbsp;·&nbsp;
[**✅ Testing & quality**](#-testing--quality)

</div>

---

## 🎯 Overview

DOMS is a distributed order-processing platform built on Spring Boot + Spring
Cloud (Netflix stack): independent services for orders, catalog, and
inventory, fronted by a Zuul edge gateway, discovered via Eureka, configured
centrally, protected by circuit breakers, and traced end-to-end with Zipkin.

On top of it sits **Control Tower** — a React + TypeScript console that
doubles as the storefront and as a live view into the mesh: service health,
Hystrix circuit-breaker state, order throughput, and a real-time event feed
of every retry, failure, and shipment as it happens.

<p align="center">
  <img src="docs/screenshots/storefront.png" alt="DOMS storefront" width="49%" />
  <img src="docs/screenshots/control-tower.png" alt="DOMS Control Tower" width="49%" />
</p>

> The [live demo](https://tanmaymish.github.io/doms-order-service/) runs a
> client-side simulation of the backend (same order lifecycle, retry, and
> circuit-breaker logic, no server required) so you can click around without
> standing up nine services and a database. Point the same build at a real
> deployment and it talks to the actual gateway instead — see
> [Demo mode vs. live mode](#demo-mode-vs-live-mode).

---

## 🏗 System Architecture

`shoppingcart-ui` does double duty: it's a `@EnableZuulProxy` edge gateway
*and* the host for the compiled React console (served as static resources on
the same origin, so there's no separate frontend deployment or CORS to
configure). Zuul auto-discovers routes for every service registered in
Eureka.

```mermaid
graph TD
    Client[Browser] --> UI["shoppingcart-ui<br/>Zuul Gateway + React SPA<br/>:8080"]

    UI -->|/api/order-service/**| Orders[order-service :8383]
    UI -->|/api/catalog-service/**| Catalog[catalog-service :8181]
    UI -->|/api/inventory-service/**| Inventory[inventory-service :8282]

    Orders --> DB[(MySQL / H2)]
    Catalog -->|Feign + Hystrix| Inventory
    Catalog --> DB

    Orders -.registers.-> Registry[Eureka service-registry :8761]
    Catalog -.registers.-> Registry
    Inventory -.registers.-> Registry
    UI -.registers.-> Registry

    Config[config-server :8888] -.configures.-> Orders
    Config -.configures.-> Catalog
    Config -.configures.-> Inventory
    Config -.configures.-> UI

    Orders -.traces.-> Zipkin[zipkin-server :9411]
    Catalog -.traces.-> Zipkin

    Catalog -.circuit metrics.-> Hystrix[hystrix-dashboard :8788]
    Orders -.circuit metrics.-> Hystrix

    OAuth[oauth2-server :8901] -.auth.-> UI
```

### Order lifecycle

```mermaid
sequenceDiagram
    participant User as Customer
    participant UI as Control Tower (React)
    participant Gateway as shoppingcart-ui (Zuul)
    participant Orders as order-service
    participant Catalog as catalog-service
    participant Inventory as inventory-service

    User->>UI: Browse catalog
    UI->>Gateway: GET /api/catalog-service/api/products
    Gateway->>Catalog: proxied
    Catalog->>Inventory: Feign + @HystrixCommand (fallback on timeout)
    Inventory-->>Catalog: stock levels
    Catalog-->>UI: in-stock products

    User->>UI: Checkout
    UI->>Gateway: POST /api/order-service/api/orders
    Gateway->>Orders: proxied
    Orders-->>UI: order id, status=CREATED

    Note over Orders: @Retryable, 3 attempts,<br/>exponential backoff
    Orders->>Orders: processOrder() → PROCESSING
    alt transient failure
        Orders->>Orders: retry (up to 3x)
        Orders->>Orders: @Recover → FAILED
    else success
        Orders->>Orders: → SHIPPED
    end

    loop polling
        UI->>Gateway: GET .../orders/{id}/status
        Gateway-->>UI: current status
    end
```

---

## ⚡ Key capabilities

- **Edge gateway + service discovery** — Zuul auto-routes to every
  Eureka-registered service; no hardcoded hostnames.
- **Resilience** — `@Retryable`/`@Recover` on the order-processing path
  (3 attempts, exponential backoff) and `@HystrixCommand` fallbacks on the
  catalog → inventory call, so a slow/unavailable inventory-service degrades
  gracefully instead of taking checkout down with it.
- **Centralized config** — every service pulls its properties from
  `config-server` at boot; per-environment overrides live in one repo.
- **Distributed tracing** — Sleuth + Zipkin correlate a request across
  gateway → catalog → inventory.
- **Real-time operations console** — Control Tower polls (or, in demo mode,
  simulates) service health, circuit-breaker state, and order throughput,
  and shows a live event stream of what the mesh is doing.
- **Real test coverage** — JUnit + Mockito unit tests and MockMvc
  integration tests for the order/catalog/inventory business logic, with
  JaCoCo coverage reports published on every CI run (see
  [Testing & quality](#-testing--quality)).

---

## 🛠 Technology stack

| Layer | Technology |
| :--- | :--- |
| **Core services** | Java 8, Spring Boot 2.0 |
| **Microservices** | Spring Cloud (Finchley), Netflix Eureka, Zuul, Hystrix, OpenFeign |
| **Persistence** | Spring Data JPA, Hibernate, H2 (default) / MySQL (docker profile) |
| **Resilience** | Spring Retry, Hystrix circuit breakers, AspectJ |
| **Observability** | Spring Boot Actuator, Zipkin, Sleuth, Hystrix Dashboard |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Framer Motion |
| **Testing** | JUnit 4, Mockito, MockMvc, JaCoCo, oxlint |
| **DevOps** | Docker, Docker Compose, GitHub Actions, GitHub Pages |

---

## 🚀 Running locally

### Full stack (Docker Compose)

```bash
git clone https://github.com/tanmaymish/doms-order-service.git
cd doms-order-service
./run.sh start_all       # builds every module (frontend included) and starts the full stack
```

* **Storefront + Control Tower**: http://localhost:8080/ui/
* **API Gateway**: http://localhost:8080/ui/api/
* **Service Discovery**: http://localhost:8761/
* **Circuit Breaker Dashboard**: http://localhost:8788/hystrix
* **Distributed Tracing**: http://localhost:9411/

`shoppingcart-ui`'s Maven build compiles the React console automatically
(via `frontend-maven-plugin`, bound to `generate-resources`) — there's no
separate `npm run build` step and nothing built is committed to git.

### Frontend only, against a running gateway

```bash
cd shoppingcart-ui/frontend
npm install
npm run dev          # proxies /ui/api to localhost:8080, see vite.config.ts
```

### Demo mode vs. live mode

The console has two modes, selected at build time:

| | **Live mode** (default) | **Demo mode** (`VITE_DEMO_MODE=true`) |
| :--- | :--- | :--- |
| Product catalog, orders, metrics | Real gateway calls to `order-service` / `catalog-service` | Fully simulated in-browser, including the 30% retry-failure rate and Hystrix trips |
| Service health (Control Tower) | Polls each service's `/actuator/health` through the gateway | Simulated |
| Use case | The actual deployed stack | [GitHub Pages demo](https://tanmaymish.github.io/doms-order-service/) — zero infrastructure |

This is exactly what ships to `shoppingcart-ui`'s static resources at build
time vs. what the [`deploy-pages.yml`](.github/workflows/deploy-pages.yml)
workflow publishes — same codebase, different `VITE_DEMO_MODE` flag.

---

## 📡 API reference

### order-service

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/orders` | Create an order (starts in `CREATED`, async-processes to `SHIPPED`/`FAILED`) |
| `GET` | `/api/orders/{id}` | Full order detail |
| `GET` | `/api/orders/{id}/status` | Lightweight status poll |
| `GET` | `/api/metrics/orders` | Aggregate success/failure counts |

### catalog-service / inventory-service

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | In-stock products (cross-checked against `inventory-service`) |
| `GET` | `/api/products/{code}` | Single product, with live stock flag |
| `GET` | `/api/inventory` | Raw stock levels |
| `GET` | `/api/inventory/{code}` | Stock level for one product |

All of the above are reachable through the gateway at
`/ui/api/{service-id}/...`, e.g. `/ui/api/order-service/api/orders`.

---

## ✅ Testing & quality

```bash
./mvnw test                              # every service's JUnit + Mockito suite
cd shoppingcart-ui/frontend && npm run lint && npm run build
```

- **order-service**: retry/backoff logic, metrics aggregation, controller
  contracts (`OrderServiceTest`, `OrderControllerTest`).
- **catalog-service**: stock-aware product filtering, inventory-lookup
  fallbacks, controller contracts (`ProductServiceTest`, `ProductControllerTest`).
- **inventory-service**: inventory lookup endpoints (`InventoryControllerTest`).

CI runs the full suite on every push/PR (no `-DskipTests`), publishes a
JaCoCo coverage summary to the workflow run, and uploads the HTML reports as
build artifacts. The frontend is linted (`oxlint`) and type-checked
(`tsc -b`) in a separate, faster job.

---

## 📦 Deployment

| Layer | Where | How |
| :--- | :--- | :--- |
| **Demo console** | GitHub Pages | Auto-deploys on push to `main` via [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) (client-side simulation, zero infra). |
| **Full stack** | Any Docker host | `./run.sh start_all` — see [`docker-compose.yml`](docker-compose.yml). |

**Enable GitHub Pages** (one time): repo **Settings → Pages → Source: Deploy
from a branch → `gh-pages` / `(root)`**. The workflow creates that branch on
its first run.

---

<div align="center">
  <sub>Built to demonstrate distributed systems fundamentals: service discovery, resilience, observability, and a UI that doesn't lie about any of it.</sub>
</div>
