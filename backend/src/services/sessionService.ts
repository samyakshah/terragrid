// backend/src/services/sessionService.ts
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/index.js'
import type { Session, SiteConfig } from '@shared/types'

/**
 * Session persistence. Pure CRUD over the sessions table.
 *
 * The service deals only in Session domain objects — callers never see SQL
 * rows or JSON-encoded config columns. JSON ser/de happens here at the
 * boundary.
 */

interface SessionRow {
  id: string
  name: string
  config: string // JSON-encoded SiteConfig
  created_at: number
  updated_at: number
}

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    name: row.name,
    config: JSON.parse(row.config) as SiteConfig,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function createSession(data: { name: string; config: SiteConfig }): Session {
  const id = uuidv4()
  const now = Date.now()

  getDb()
    .prepare(
      `INSERT INTO sessions (id, name, config, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(id, data.name, JSON.stringify(data.config), now, now)

  return {
    id,
    name: data.name,
    config: data.config,
    createdAt: now,
    updatedAt: now,
  }
}

export function findSession(id: string): Session | null {
  const row = getDb().prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as
    | SessionRow
    | undefined

  return row ? rowToSession(row) : null
}

export function updateSession(
  id: string,
  patch: { name?: string; config?: SiteConfig },
): Session | null {
  const existing = findSession(id)
  if (!existing) return null

  const name = patch.name ?? existing.name
  const config = patch.config ?? existing.config
  const updatedAt = Date.now()

  getDb()
    .prepare(`UPDATE sessions SET name = ?, config = ?, updated_at = ? WHERE id = ?`)
    .run(name, JSON.stringify(config), updatedAt, id)

  return { ...existing, name, config, updatedAt }
}

export function listSessions(limit: number): Session[] {
  const rows = getDb()
    .prepare(`SELECT * FROM sessions ORDER BY updated_at DESC LIMIT ?`)
    .all(limit) as SessionRow[]

  return rows.map(rowToSession)
}

export function deleteSession(id: string): boolean {
  const result = getDb().prepare(`DELETE FROM sessions WHERE id = ?`).run(id)

  return result.changes > 0
}
