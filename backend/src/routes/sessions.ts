// backend/src/routes/sessions.ts
import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import * as sessionService from '../services/sessionService.js'

/**
 * REST routes for /sessions.
 *
 * Zod schemas guard the boundary — every request body is parsed before it
 * reaches the service. Invalid input never gets stored.
 */

const router = Router()

// Validation schemas

const QuantitiesSchema = z.object({
  megapackXL: z.number().int().min(0).max(1000),
  megapack2: z.number().int().min(0).max(1000),
  megapack: z.number().int().min(0).max(1000),
  powerPack: z.number().int().min(0).max(1000),
})

const SiteConfigSchema = z.object({
  quantities: QuantitiesSchema,
})

const CreateBodySchema = z.object({
  name: z.string().trim().min(1).max(100).default('Untitled site'),
  config: SiteConfigSchema,
})

const UpdateBodySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  config: SiteConfigSchema.optional(),
})

// Routes

router.post('/', (req: Request, res: Response) => {
  const parsed = CreateBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body', code: 400, issues: parsed.error.issues })
  }

  const session = sessionService.createSession(parsed.data)
  res.status(201).json({ sessionId: session.id, session })
})

router.get('/', (req: Request, res: Response) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const sessions = sessionService.listSessions(limit)
  res.json({ sessions })
})

router.get('/:id', (req: Request, res: Response) => {
  const session = sessionService.findSession(req.params.id as string)
  if (!session) {
    return res.status(404).json({ error: 'Session not found', code: 404 })
  }
  res.json({ session })
})

router.put('/:id', (req: Request, res: Response) => {
  const parsed = UpdateBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body', code: 400, issues: parsed.error.issues })
  }

  const session = sessionService.updateSession(req.params.id as string, parsed.data)
  if (!session) {
    return res.status(404).json({ error: 'Session not found', code: 404 })
  }
  res.json({ session })
})

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = sessionService.deleteSession(req.params.id as string)
  if (!deleted) {
    return res.status(404).json({ error: 'Session not found', code: 404 })
  }
  res.json({ deleted: true })
})

export default router