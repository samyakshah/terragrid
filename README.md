# TerraGrid

TerraGrid is an industrial battery site configurator built for the Tesla Energy Service Engineering UI evaluation. It lets users configure battery quantities, automatically calculates the required transformers, budget, site footprint, and net energy, then generates a visual site layout that stays within the 100ft width constraint.

Live app: https://terragrid.onrender.com/

Github: https://github.com/samyakshah/terragrid

## Features

- Configure MegapackXL, Megapack2, Megapack, and PowerPack quantities
- Automatically adds 1 transformer for every 2 batteries
- Calculates total budget, land size, net energy, and energy density
- Generates a responsive site layout with a maximum row width of 100ft
- Saves sessions to the backend so users can resume later, even after cache clears
- Supports loading saved sessions by session URL or session ID
- Exports the site layout and summary as a PDF
- Includes frontend and backend tests

## Tech Stack

- React + TypeScript + Vite
- Node.js + Express + TypeScript
- SQLite via `better-sqlite3`
- Vitest + React Testing Library
- Render for hosting

## Local Setup

Prerequisite: Node.js 20.x. This project was built with Node `20.18.0`.

```bash
npm install
npm run dev
```

The frontend runs at:

```bash
http://localhost:8000
```

The backend runs at:

```bash
http://localhost:3001
```

In local development, Vite proxies frontend `/api/*` requests to the backend.

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Default local values:

```env
PORT=3001
DATABASE_PATH=./data/terragrid.db
CORS_ORIGIN=http://localhost:8000
NODE_ENV=development
```

## Available Commands

```bash
npm run dev        # build shared types and run frontend + backend locally
npm run build      # build shared, backend, and frontend packages
npm start          # run the compiled backend, which also serves frontend/dist
npm test           # run frontend and backend tests
npm run typecheck  # run TypeScript checks
```

## Production / Render

The app is deployed on Render at:

```bash
https://terragrid.onrender.com/
```

Recommended Render settings:

```bash
Build Command: npm install && npm run build
Start Command: npm start
```

The Express backend serves the built React app from `frontend/dist`, so the deployed service runs as a single web service.

## Project Structure

```bash
terragrid/
  frontend/   # React UI, layout engine, PDF export, frontend tests
  backend/    # Express API, SQLite persistence, backend tests
  shared/     # Shared TypeScript types used by frontend and backend
```

## Notes

- Transformers are derived automatically and are not directly editable.
- Session persistence is backend-backed, not localStorage-only, so saved sessions survive browser cache clears.
