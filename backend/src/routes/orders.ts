import { randomUUID } from 'node:crypto'
import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { getDb } from '../db/index.js'

const router = Router()

const QuantitiesSchema = z.object({
  megapackXL: z.number().int().min(0).max(1000),
  megapack2: z.number().int().min(0).max(1000),
  megapack: z.number().int().min(0).max(1000),
  powerPack: z.number().int().min(0).max(1000),
})

const CreatePurchaseOrderSchema = z.object({
  sessionId: z.string().nullable(),
  config: z.object({
    quantities: QuantitiesSchema,
  }),
  summary: z.unknown(),
  contact: z.object({
    companyName: z.string().trim().min(1).max(160),
    installationAddress: z.string().trim().min(1).max(240),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(160),
    phoneNumber: z.string().trim().min(7).max(40),
    contactPreference: z.enum(['sms', 'email', 'phone']),
  }),
  payment: z
    .object({
      cardLast4: z.string().regex(/^\d{4}$/),
      billingZip: z.string().trim().min(5).max(12),
    })
    .optional(),
  depositCents: z.number().int().min(0).default(0),
})

router.post('/', (req: Request, res: Response) => {
  const parsed = CreatePurchaseOrderSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid purchase order request',
      code: 400,
      issues: parsed.error.issues,
    })
  }

  const totalBatteries = Object.values(parsed.data.config.quantities).reduce(
    (sum, quantity) => sum + quantity,
    0,
  )

  if (totalBatteries <= 0) {
    return res.status(400).json({
      error: 'Select at least one battery before placing an order.',
      code: 400,
    })
  }

  const id = randomUUID()
  const createdAt = Date.now()

  getDb()
    .prepare(
      `
      INSERT INTO purchase_orders (
        id,
        session_id,
        company_name,
        installation_address,
        first_name,
        last_name,
        email,
        phone_number,
        contact_preference,
        card_last4,
        billing_zip,
        deposit_cents,
        config_json,
        summary_json,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .run(
      id,
      parsed.data.sessionId,
      parsed.data.contact.companyName,
      parsed.data.contact.installationAddress,
      parsed.data.contact.firstName,
      parsed.data.contact.lastName,
      parsed.data.contact.email,
      parsed.data.contact.phoneNumber,
      parsed.data.contact.contactPreference,
      parsed.data.payment?.cardLast4 ?? null,
      parsed.data.payment?.billingZip ?? null,
      parsed.data.depositCents,
      JSON.stringify(parsed.data.config),
      JSON.stringify(parsed.data.summary),
      createdAt,
    )

  return res.status(201).json({
    orderId: id,
    createdAt,
  })
})

export default router
