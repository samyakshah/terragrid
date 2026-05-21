import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import sessionsRouter from './routes/sessions.js'
import ordersRouter from './routes/orders.js'

const app = express()

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:8000'

app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'terragrid-backend',
    uptime: process.uptime(),
  })
})

app.use('/sessions', sessionsRouter)
app.use('/orders', ordersRouter)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendDist = path.resolve(__dirname, '../../frontend/dist')

if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist))

  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (
      req.path.startsWith('/sessions') ||
      req.path.startsWith('/orders') ||
      req.path === '/health'
    ) {
      return next()
    }

    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found', code: 404 })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err)
  res.status(500).json({ error: 'Internal server error', code: 500 })
})

export default app
