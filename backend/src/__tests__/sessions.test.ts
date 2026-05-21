import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import { closeDb } from '../db/index.js'

// Use an in-memory DB for tests — fast and isolated.
// MUST be set before importing the app, which initialises the DB lazily.
process.env.DATABASE_PATH = ':memory:'

const { default: app } = await import('../app.js')

const VALID_CONFIG = {
  quantities: { megapackXL: 2, megapack2: 0, megapack: 0, powerPack: 0 },
}

afterAll(() => {
  closeDb()
})

beforeEach(() => {
  // Each test starts with a fresh DB. We close and let the next request reopen it.
  closeDb()
})

describe('POST /sessions', () => {
  it('creates a session and returns 201 with sessionId', async () => {
    const res = await request(app)
      .post('/sessions')
      .send({ name: 'Test site', config: VALID_CONFIG })

    expect(res.status).toBe(201)
    expect(res.body.sessionId).toMatch(/^[0-9a-f-]{36}$/)
    expect(res.body.session.name).toBe('Test site')
    expect(res.body.session.config).toEqual(VALID_CONFIG)
  })

  it('uses default name when name is omitted', async () => {
    const res = await request(app).post('/sessions').send({ config: VALID_CONFIG })

    expect(res.status).toBe(201)
    expect(res.body.session.name).toBe('Untitled site')
  })

  it('rejects invalid quantities with 400', async () => {
    const res = await request(app)
      .post('/sessions')
      .send({ config: { quantities: { megapackXL: -1, megapack2: 0, megapack: 0, powerPack: 0 } } })

    expect(res.status).toBe(400)
  })

  it('rejects missing config with 400', async () => {
    const res = await request(app).post('/sessions').send({ name: 'No config' })

    expect(res.status).toBe(400)
  })
})

describe('GET /sessions/:id', () => {
  it('returns 404 for an unknown ID', async () => {
    const res = await request(app).get('/sessions/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })

  it('returns a previously-created session', async () => {
    const created = await request(app)
      .post('/sessions')
      .send({ name: 'Find me', config: VALID_CONFIG })

    const found = await request(app).get(`/sessions/${created.body.sessionId}`)

    expect(found.status).toBe(200)
    expect(found.body.session.name).toBe('Find me')
  })
})

describe('PUT /sessions/:id', () => {
  it('updates name and config', async () => {
    const created = await request(app).post('/sessions').send({ name: 'Old', config: VALID_CONFIG })
    const id = created.body.sessionId

    const updated = await request(app)
      .put(`/sessions/${id}`)
      .send({
        name: 'New',
        config: { quantities: { megapackXL: 5, megapack2: 0, megapack: 0, powerPack: 0 } },
      })

    expect(updated.status).toBe(200)
    expect(updated.body.session.name).toBe('New')
    expect(updated.body.session.config.quantities.megapackXL).toBe(5)
  })

  it('returns 404 when updating an unknown session', async () => {
    const res = await request(app)
      .put('/sessions/00000000-0000-0000-0000-000000000000')
      .send({ name: 'X' })

    expect(res.status).toBe(404)
  })
})

describe('GET /sessions (list)', () => {
  it('returns sessions in updated_at DESC order', async () => {
    const a = await request(app).post('/sessions').send({ name: 'A', config: VALID_CONFIG })
    await new Promise((r) => setTimeout(r, 5)) // ensure distinct timestamps
    const b = await request(app).post('/sessions').send({ name: 'B', config: VALID_CONFIG })

    const list = await request(app).get('/sessions')

    expect(list.status).toBe(200)
    expect(list.body.sessions[0].id).toBe(b.body.sessionId)
    expect(list.body.sessions[1].id).toBe(a.body.sessionId)
  })
})

describe('DELETE /sessions/:id', () => {
  it('removes a session', async () => {
    const created = await request(app).post('/sessions').send({ name: 'Del', config: VALID_CONFIG })
    const id = created.body.sessionId

    const del = await request(app).delete(`/sessions/${id}`)
    expect(del.status).toBe(200)
    expect(del.body.deleted).toBe(true)

    const get = await request(app).get(`/sessions/${id}`)
    expect(get.status).toBe(404)
  })

  it('returns 404 when deleting an unknown session', async () => {
    const res = await request(app).delete('/sessions/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})
