import type { SiteConfig, LayoutRow, SiteSummary } from '@shared/types'
import { DEVICES, TRANSFORMER, DEVICE_KEYS } from '@/constants/devices'
import { computeTransformerCount } from './layoutEngine'

/**
 * Average peak-hour household power demand: ~3 kWh in an hour.
 * So 1 MWh of battery capacity can serve ~333 homes for one peak hour.
 * This is the figure utilities and Tesla itself use in press releases
 * (e.g. Tesla's Hornsdale battery is marketed as serving "30,000 homes
 * for an hour" with ~100 MWh of storage).
 */
const HOMES_PER_MWH_PEAK_HOUR = 333

/**
 * Computes the four summary metrics displayed in the SummaryBar.
 * Pure function.
 */
export function calculateSummary(config: SiteConfig, layout: LayoutRow[]): SiteSummary {
  const transformerCount = computeTransformerCount(config)

  return {
    totalBudget: computeBudget(config, transformerCount),
    transformerCount,
    siteWidthFt: computeSiteWidth(layout),
    siteDepthFt: computeSiteDepth(layout),
    netEnergyMWh: computeNetEnergy(config, transformerCount),
    homesPowered: computeHomesPowered(config, transformerCount),
  }
}

function computeBudget(config: SiteConfig, transformerCount: number): number {
  let total = transformerCount * TRANSFORMER.cost
  for (const key of DEVICE_KEYS) {
    total += config.quantities[key] * DEVICES[key].cost
  }
  return total
}

function computeNetEnergy(config: SiteConfig, transformerCount: number): number {
  let total = transformerCount * TRANSFORMER.energyMWh
  for (const key of DEVICE_KEYS) {
    total += config.quantities[key] * DEVICES[key].energyMWh
  }
  // Round to 1 decimal — avoids 7.499999... display artefacts from float math
  return Math.round(total * 10) / 10
}

function computeSiteWidth(layout: LayoutRow[]): number {
  if (layout.length === 0) return 0
  return Math.max(...layout.map((row) => row.totalWidthFt))
}

function computeSiteDepth(layout: LayoutRow[]): number {
  return layout.length * 10
}

function computeHomesPowered(config: SiteConfig, transformerCount: number): number {
  const energy = computeNetEnergy(config, transformerCount)
  if (energy <= 0) return 0
  return Math.round(energy * HOMES_PER_MWH_PEAK_HOUR)
}
