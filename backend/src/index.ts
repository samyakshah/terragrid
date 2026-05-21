import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import sessionsRouter from './routes/sessions.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:8000'
const NODE_ENV = process.env.NODE_ENV || 'development'

app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json({ limit: '1mb' }))

// API routes

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'terragrid-backend', uptime: process.uptime() })
})

app.use('/sessions', sessionsRouter)

// Static frontend (when built)
//
// In dev, the Vite server runs separately on port 8000 and proxies /api.
// In production (or any time `frontend/dist` exists), we serve the built React
// app from this same Express server — one origin, one URL.

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendDist = path.resolve(__dirname, '../../frontend/dist')

if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist))

  // SPA fallback — any unmatched GET serves index.html so deep links
  // like /session/<uuid> work on direct page loads.
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/sessions') || req.path === '/health') return next()
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

// Error handlers

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found', code: 404 })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err)
  res.status(500).json({ error: 'Internal server error', code: 500 })
})

// Start

app.listen(PORT, () => {
  console.log(`[terragrid-backend] listening on port ${PORT} (${NODE_ENV})`)
})

export default app
