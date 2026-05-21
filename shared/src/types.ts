/**
 * TerraGrid — shared types.
 *
 * This file is imported by both the frontend and the backend (via `@shared/*` path alias).
 * No runtime code lives here — only type declarations and the device catalog metadata
 * that both sides agree on.
 */

// Device taxonomy

/**
 * The four user-selectable battery types.
 * Transformers exist as a placement type but are never directly configured
 * by the user - they are auto-injected based on battery count.
 */
export type DeviceType = 'megapackXL' | 'megapack2' | 'megapack' | 'powerPack'

/**
 * In the layout output, a placement can also be a transformer. We extend
 * DeviceType here rather than in the main type so user-facing config code
 * can't accidentally set transformer counts.
 */
export type PlacementType = DeviceType | 'transformer'

/**
 * Specification for one device. Dimensions are in feet; energy is in MWh.
 * energyMWh is positive for batteries and negative for transformers (which
 * consume energy from the site).
 */
export interface DeviceSpec {
  name: string
  widthFt: number
  depthFt: number
  energyMWh: number
  cost: number
  year: number | null // null for transformer — spec has no release date
}

// Site configuration (the user's input)

/**
 * The user-facing configuration. The whole app derives its behaviour from
 * this object — change a quantity and everything else recomputes.
 */
export interface SiteConfig {
  quantities: Record<DeviceType, number>
}

// Layout output (what the engine produces)

export interface DevicePlacement {
  type: PlacementType
  widthFt: number
  depthFt: number
  isTransformer: boolean
}

export interface LayoutRow {
  devices: DevicePlacement[]
  totalWidthFt: number
}

// Summary (the metric cards)

export interface SiteSummary {
  totalBudget: number // USD
  transformerCount: number
  siteWidthFt: number // max row width
  siteDepthFt: number // rows * 10
  netEnergyMWh: number // can be negative
  energyDensityKwhPerSqFt: number
}

// Persistence

export interface Session {
  id: string // UUID
  name: string
  config: SiteConfig
  createdAt: number // Unix ms
  updatedAt: number // Unix ms
}

// Order

export interface OrderContactInfo {
  companyName: string
  installationAddress: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  contactPreference: 'email' | 'sms' | 'phone'
}

export interface OrderPaymentSummary {
  cardLast4: string
  billingZip: string
}

export interface CreateOrderRequest {
  sessionId: string | null
  config: SiteConfig
  summary: SiteSummary
  contact: OrderContactInfo
  payment?: OrderPaymentSummary
  depositCents?: number
}

export interface CreateOrderResponse {
  orderId: string
  createdAt: number
}
