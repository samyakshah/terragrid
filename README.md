# TerraGrid

> Industrial battery site configurator for the Tesla Energy Service Engineering UI evaluation.

TerraGrid lets an operator choose battery quantities, automatically calculates required transformers, and generates a visual floor-plan that respects the 100 ft width constraint. Sessions are persisted to a backend-backed SQLite database so they survive browser cache clears and can be shared by URL.

**Live app:** https://terragrid.onrender.com  
**Repository:** https://github.com/samyakshah/terragrid

---

## Features

v
| Capability | Detail |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| Battery configurator | Stepper inputs for MegapackXL, Megapack 2, Megapack, and PowerPack |
| Auto-transformer injection | 1 transformer per 2 batteries (ceiling division), read-only |
| Live metrics | Budget, net energy (MWh), energy density (kWh/ft²), and site footprint |
| Site layout canvas | Best-fit-decreasing bin-packing, max row width 100 ft |
| Session persistence | POST/PUT to SQLite backend — survives cache clears; shareable by URL |
| Session resume | Load by session ID or by pasting a session URL |
| PDF export | Downloads site layout and summary as a single-page PDF |
| Purchase order flow | Multi-step drawer: contact info, contact preference, mock payment |
| Input validation | Per-field error messages on both frontend (Zod-free custom validators) and backend (Zod) |
| Tests | Vitest + React Testing Library (frontend) and Supertest (backend) |

---

## Tech stack

| Layer        | Technology                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Frontend     | React 18 + TypeScript + Vite, CSS Modules                                                            |
| Backend      | Node.js + Express + TypeScript                                                                       |
| Database     | SQLite via `better-sqlite3` (WAL mode)                                                               |
| Shared types | Monorepo `shared/` package — single source of truth for `Session`, `SiteConfig`, `SiteSummary`, etc. |
| Testing      | Vitest, React Testing Library, Supertest                                                             |
| Hosting      | Render (single web service — Express serves `frontend/dist` in production)                           |

---

## Prerequisites

- Node.js **20.18.0** (`.nvmrc` / `engines` field enforces this)

---

## Local setup

```bash
# 1. Install all workspace dependencies from the repo root
npm install

# 2. Create the backend environment file
cp backend/.env.example backend/.env

# 3. Start frontend + backend concurrently
npm run dev
```

| Service           | URL                   |
| ----------------- | --------------------- |
| Frontend (Vite)   | http://localhost:8000 |
| Backend (Express) | http://localhost:3001 |

In development, Vite proxies all `/api/*` requests to the backend so the frontend origin never changes.

---

## Environment variables

`backend/.env` (copy from `backend/.env.example`):

```env
PORT=3001
DATABASE_PATH=./data/terragrid.db
CORS_ORIGIN=http://localhost:8000
NODE_ENV=development
```

SQLite is file-based — no external database setup is needed. The `data/` directory is created automatically on first run.

---

## Available scripts

Run these from the **repo root**:

```bash
npm run dev        # Build shared types, then start frontend + backend in parallel
npm run build      # Production build: shared → backend → frontend
npm start          # Serve the compiled app (backend serves frontend/dist)
npm test           # Run frontend and backend test suites
npm run typecheck  # TypeScript strict checks across all packages
npm run lint       # ESLint across .ts / .tsx
npm run format     # Prettier over all source files
npm run clean      # Remove all build artefacts and local database files
```

---

## Project structure

```
terragrid/
├── shared/                  # Shared TypeScript types (imported by frontend + backend)
│   └── src/types.ts         # DeviceSpec, SiteConfig, SiteSummary, Session, Order types
│
├── frontend/
│   └── src/
│       ├── components/      # UI components (ConfigPanel, SiteLayoutCanvas, QuoteDrawer, …)
│       ├── hooks/
│       │   └── useTerraGrid.ts   # Single state hook — all app logic lives here
│       ├── utils/
│       │   ├── calculator.ts     # Pure summary metric computations
│       │   └── layoutEngine.ts   # Best-fit-decreasing bin-packing algorithm
│       ├── lib/
│       │   ├── api.ts            # Typed fetch client (ApiError, createSession, …)
│       │   ├── validation.ts     # Field-level validators (quantity, email, phone)
│       │   └── sessionUrl.ts     # Read / write session ID from the URL query string
│       └── constants/
│           └── devices.ts        # Device catalog — single source of spec values
│
└── backend/
    └── src/
        ├── app.ts               # Express app setup, CORS, static serving
        ├── routes/
        │   ├── sessions.ts      # CRUD for /sessions (Zod-validated)
        │   └── orders.ts        # POST /orders (purchase order intake)
        ├── services/
        │   └── sessionService.ts  # SQL ↔ domain-object mapping
        └── db/
            └── index.ts          # SQLite singleton, schema initialisation, WAL config
```

---

## Architecture notes

**State management** — `useTerraGrid` is the single source of truth. Components receive data and dispatch actions through this hook; they never call the API, layout engine, or calculator directly. This keeps all state transitions in one place and makes the hook independently testable.

**Auto-save debouncing** — every quantity or name change schedules a 500 ms debounced save. Rapid input coalesces into one network request. The first save creates a session (`POST`) and rewrites the URL query string; subsequent saves update it (`PUT`).

**Layout algorithm** — devices are sorted largest-first (first-fit decreasing), then packed using a best-fit bin-packing pass. This minimises wasted row space while keeping the layout visually intuitive: large batteries lead each row, transformers fill gaps.

**Shared types** — `shared/src/types.ts` is compiled first and re-exported to both `frontend` and `backend` via a TypeScript path alias (`@shared/*`). Device specs, session shapes, and order payloads are defined once and never duplicated.

**Input safety** — the backend validates every request body with Zod before it reaches the service layer. Invalid data is rejected at the boundary with a structured `400` response including per-field issue details. The frontend mirrors this validation client-side for instant feedback without a round trip.

---

## Deployment (Render)

The app runs as a **single Render web service**. In production, Express compiles the React app (`frontend/dist`) and serves it as static files, eliminating the need for a separate static-site host.

Recommended Render settings:

```
Build Command: npm install && npm run build
Start Command: npm start
```

The `DATABASE_PATH` environment variable on Render points to a persistent disk mount so session data survives deploys.

---

## Running tests

```bash
npm test
```

Frontend tests (Vitest + React Testing Library) cover the layout engine, calculator, and summary bar. Backend tests (Vitest + Supertest) run against an in-memory SQLite instance to keep them fast and hermetic.
