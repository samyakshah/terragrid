import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { closeDb, getDb } from '../db/index.js'

process.env.DATABASE_PATH = ':memory:'

const { default: app } = await import('../app.js')

const VALID_CONFIG = {
  quantities: {
    megapackXL: 2,
    megapack2: 0,
    megapack: 0,
    powerPack: 0,
  },
}

const VALID_SUMMARY = {
  totalBudget: 250000,
  transformerCount: 1,
  siteWidthFt: 90,
  siteDepthFt: 10,
  netEnergyMWh: 7.5,
  energyDensityKwhPerSqFt: 8.33,
}

const VALID_CONTACT = {
  companyName: 'Tesla Energy Customer',
  installationAddress: '3500 Deer Creek Rd, Palo Alto, CA',
  firstName: 'Sam',
  lastName: 'Shah',
  email: 'sam@example.com',
  phoneNumber: '5551234567',
  contactPreference: 'email',
}

afterAll(() => {
  closeDb()
})

beforeEach(() => {
  closeDb()
})

describe('POST /orders', () => {
  it('creates a purchase order for a valid battery configuration', async () => {
    const res = await request(app).post('/orders').send({
      sessionId: null,
      config: VALID_CONFIG,
      summary: VALID_SUMMARY,
      contact: VALID_CONTACT,
    })

    expect(res.status).toBe(201)
    expect(res.body.orderId).toMatch(/^[0-9a-f-]{36}$/)
    expect(typeof res.body.createdAt).toBe('number')

    const row = getDb()
      .prepare('SELECT * FROM purchase_orders WHERE id = ?')
      .get(res.body.orderId) as
      | {
          company_name: string
          email: string
          config_json: string
          summary_json: string
        }
      | undefined

    expect(row).toBeTruthy()
    expect(row?.company_name).toBe(VALID_CONTACT.companyName)
    expect(row?.email).toBe(VALID_CONTACT.email)
    expect(JSON.parse(row?.config_json ?? '{}')).toEqual(VALID_CONFIG)
    expect(JSON.parse(row?.summary_json ?? '{}')).toEqual(VALID_SUMMARY)
  })

  it('rejects an order with zero selected batteries', async () => {
    const res = await request(app)
      .post('/orders')
      .send({
        sessionId: null,
        config: {
          quantities: {
            megapackXL: 0,
            megapack2: 0,
            megapack: 0,
            powerPack: 0,
          },
        },
        summary: VALID_SUMMARY,
        contact: VALID_CONTACT,
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Select at least one battery before placing an order.')
  })

  it('rejects invalid contact information', async () => {
    const res = await request(app)
      .post('/orders')
      .send({
        sessionId: null,
        config: VALID_CONFIG,
        summary: VALID_SUMMARY,
        contact: {
          ...VALID_CONTACT,
          email: 'not-an-email',
        },
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid purchase order request')
  })

  it('rejects invalid battery quantities', async () => {
    const res = await request(app)
      .post('/orders')
      .send({
        sessionId: null,
        config: {
          quantities: {
            megapackXL: -1,
            megapack2: 0,
            megapack: 0,
            powerPack: 0,
          },
        },
        summary: VALID_SUMMARY,
        contact: VALID_CONTACT,
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid purchase order request')
  })
})
