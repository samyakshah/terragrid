import { getDb, closeDb } from './index.js'

const db = getDb()
const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'").get()

if (tableInfo) {
  console.log('[migrate] sessions table exists')
} else {
  console.error('[migrate] schema did not apply')
  process.exit(1)
}

closeDb()