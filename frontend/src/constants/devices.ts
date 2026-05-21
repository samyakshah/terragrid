import type { DeviceType, DeviceSpec } from '@shared/types'

/**
 * The device catalog. These values are taken directly from the assignment spec.
 * If a device's properties ever change, this is the only place to edit.
 */
export const DEVICES: Record<DeviceType, DeviceSpec> = {
  megapackXL: {
    name: 'MegapackXL',
    widthFt: 40,
    depthFt: 10,
    energyMWh: 4,
    cost: 120_000,
    year: 2022,
  },
  megapack2: {
    name: 'Megapack 2',
    widthFt: 30,
    depthFt: 10,
    energyMWh: 3,
    cost: 80_000,
    year: 2021,
  },
  megapack: {
    name: 'Megapack',
    widthFt: 30,
    depthFt: 10,
    energyMWh: 2,
    cost: 50_000,
    year: 2005,
  },
  powerPack: {
    name: 'PowerPack',
    widthFt: 10,
    depthFt: 10,
    energyMWh: 1,
    cost: 10_000,
    year: 2000,
  },
}

/**
 * Transformers are placed but not configured. The user never sees a quantity
 * input for transformers — the engine adds them automatically.
 */
export const TRANSFORMER: DeviceSpec = {
  name: 'Transformer',
  widthFt: 10,
  depthFt: 10,
  energyMWh: -0.5,
  cost: 10_000,
  year: null,
}

// ─── Business constants ───────────────────────────────────────────────────

/** One transformer is required per N batteries (spec: 1 per 2). */
export const TRANSFORMER_RATIO = 2

/** No layout row may exceed this width in feet (spec). */
export const MAX_SITE_WIDTH_FT = 100

/** The four ordered DeviceType keys, for iteration in UI and tests. */
export const DEVICE_KEYS: DeviceType[] = ['megapackXL', 'megapack2', 'megapack', 'powerPack']

/** A zeroed-out SiteConfig — the initial state for a new session. */
export const EMPTY_CONFIG = {
  quantities: { megapackXL: 0, megapack2: 0, megapack: 0, powerPack: 0 },
} as const
