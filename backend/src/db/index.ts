import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

/**
 * SQLite database singleton.
 *
 * Why a singleton: better-sqlite3 connections are synchronous and cheap to keep
 * open. Opening per-request would add overhead with zero benefit. The connection
 * is held for the lifetime of the process.
 *
 * The schema is applied on first access — no separate migration step needed for
 * a single-table app. If we ever add a second table, we'll introduce a real
 * migration runner.
 */

let db: Database.Database | null = null

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL DEFAULT 'Untitled site',
    config      TEXT    NOT NULL,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at DESC);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id                    TEXT    PRIMARY KEY,
    session_id             TEXT,
    company_name           TEXT    NOT NULL,
    installation_address   TEXT    NOT NULL,
    first_name             TEXT    NOT NULL,
    last_name              TEXT    NOT NULL,
    email                  TEXT    NOT NULL,
    phone_number           TEXT    NOT NULL,
    contact_preference     TEXT    NOT NULL,
    card_last4             TEXT,
    billing_zip            TEXT,
    deposit_cents          INTEGER NOT NULL DEFAULT 0,
    config_json            TEXT    NOT NULL,
    summary_json           TEXT    NOT NULL,
    created_at             INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_purchase_orders_created ON purchase_orders(created_at DESC);
`

export function getDb(): Database.Database {
  if (db) return db

  const path = process.env.DATABASE_PATH || './data/terragrid.db'

  // Ensure parent dir exists — better-sqlite3 won't create it
  mkdirSync(dirname(path), { recursive: true })

  db = new Database(path)
  db.pragma('journal_mode = WAL') // better concurrent reads, recommended default
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)

  return db
}

/** For tests — close and reset the connection. */
export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
