import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import sessionsRouter from './routes/sessions.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:8000'

app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json({ limit: '1mb' }))

// Routes

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'terragrid-backend', uptime: process.uptime() })
})

app.use('/sessions', sessionsRouter)

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
  console.log(`[terragrid-backend] listening on http://localhost:${PORT}`)
})

export default app // exported for supertest
