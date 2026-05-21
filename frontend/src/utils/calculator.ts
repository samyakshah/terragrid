import type { SiteConfig, LayoutRow, SiteSummary } from '@shared/types'
import { DEVICES, TRANSFORMER, DEVICE_KEYS } from '@/constants/devices'
import { computeTransformerCount } from './layoutEngine'

/**
 * Computes the four summary metrics displayed in the SummaryBar.
 * Pure function.
 */
export function calculateSummary(config: SiteConfig, layout: LayoutRow[]): SiteSummary {
  const transformerCount = computeTransformerCount(config)
  const siteWidthFt = computeSiteWidth(layout)
  const siteDepthFt = computeSiteDepth(layout)
  const netEnergyMWh = computeNetEnergy(config, transformerCount)

  return {
    totalBudget: computeBudget(config, transformerCount),
    transformerCount,
    siteWidthFt,
    siteDepthFt,
    netEnergyMWh,
    energyDensityKwhPerSqFt: computeEnergyDensityKwhPerSqFt(netEnergyMWh, siteWidthFt, siteDepthFt),
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

/**
 * Energy density is the net usable energy divided by the physical site footprint.
 *
 * Formula:
 *   energyDensity = netEnergyKWh / siteAreaSqFt
 *
 * Example:
 *   8 MWh = 8,000 kWh
 *   land = 100ft * 20ft = 2,000 sq ft
 *   density = 8,000 / 2,000 = 4 kWh / sq ft
 */
function computeEnergyDensityKwhPerSqFt(
  netEnergyMWh: number,
  siteWidthFt: number,
  siteDepthFt: number,
): number {
  const areaSqFt = siteWidthFt * siteDepthFt

  if (areaSqFt <= 0 || netEnergyMWh <= 0) {
    return 0
  }

  const netEnergyKWh = netEnergyMWh * 1000

  // Keep two decimals for display usefulness.
  return Math.round((netEnergyKWh / areaSqFt) * 100) / 100
}
