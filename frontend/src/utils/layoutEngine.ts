import type { SiteConfig, LayoutRow, DevicePlacement } from '@shared/types'
import {
  DEVICES,
  TRANSFORMER,
  TRANSFORMER_RATIO,
  MAX_SITE_WIDTH_FT,
  DEVICE_KEYS,
} from '@/constants/devices'

/**
 * Computes a site floor plan from a SiteConfig.
 */
export function computeLayout(config: SiteConfig): LayoutRow[] {
  const devices = expandDevices(config)
  if (devices.length === 0) return []

  const sortedDevices = [...devices].sort(comparePlacementsForPacking)

  return packRowsBucketedBestFit(sortedDevices)
}

/**
 * Sort larger devices first.
 *
 * Tie-breakers are intentionally deterministic so the visual layout does not
 * randomly change between renders.
 */
function comparePlacementsForPacking(a: DevicePlacement, b: DevicePlacement): number {
  if (b.widthFt !== a.widthFt) return b.widthFt - a.widthFt

  // Prefer real batteries before transformers when widths are equal.
  // This keeps the visual layout more intuitive.
  if (a.isTransformer !== b.isTransformer) {
    return a.isTransformer ? 1 : -1
  }

  // Stable deterministic ordering by type name.
  return a.type.localeCompare(b.type)
}

/**
 * Flatten the selected battery quantities into physical placements and add
 * automatically required transformers.
 */
function expandDevices(config: SiteConfig): DevicePlacement[] {
  const placements: DevicePlacement[] = []

  for (const type of DEVICE_KEYS) {
    const spec = DEVICES[type]

    for (let i = 0; i < config.quantities[type]; i++) {
      placements.push({
        type,
        widthFt: spec.widthFt,
        depthFt: spec.depthFt,
        isTransformer: false,
      })
    }
  }

  const transformerCount = computeTransformerCount(config)

  for (let i = 0; i < transformerCount; i++) {
    placements.push({
      type: 'transformer',
      widthFt: TRANSFORMER.widthFt,
      depthFt: TRANSFORMER.depthFt,
      isTransformer: true,
    })
  }

  return placements
}

function packRowsBucketedBestFit(devices: DevicePlacement[]): LayoutRow[] {
  const rows: LayoutRow[] = []

  for (const device of devices) {
    // Find the row with least remaining space that still fits this device
    let bestRow = -1
    let bestRemaining = Infinity
    for (let i = 0; i < rows.length; i++) {
      const remaining = MAX_SITE_WIDTH_FT - rows[i].totalWidthFt
      if (remaining >= device.widthFt && remaining < bestRemaining) {
        bestRow = i
        bestRemaining = remaining
      }
    }

    if (bestRow === -1) {
      rows.push({ devices: [device], totalWidthFt: device.widthFt })
    } else {
      rows[bestRow] = {
        devices: [...rows[bestRow].devices, device],
        totalWidthFt: rows[bestRow].totalWidthFt + device.widthFt,
      }
    }
  }

  return rows
}

/**
 * Number of transformers required for a config.
 *
 * We use ceil because a partial group still requires transformer support.
 * Example:
 *   1 battery   -> 1 transformer
 *   2 batteries -> 1 transformer
 *   3 batteries -> 2 transformers
 */
export function computeTransformerCount(config: SiteConfig): number {
  const total = totalBatteries(config)
  return Math.ceil(total / TRANSFORMER_RATIO)
}

/**
 * Sum of all battery quantities.
 *
 * Transformers are derived separately and should not be user-editable.
 */
export function totalBatteries(config: SiteConfig): number {
  return DEVICE_KEYS.reduce((sum, key) => sum + config.quantities[key], 0)
}
