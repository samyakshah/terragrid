import type { SiteSummary, SiteConfig } from '@shared/types'
import {
  formatBudget,
  formatEnergy,
  formatLand,
  formatEnergyDensity,
  formatDeviceCount,
} from '@/lib/format'
import { DEVICE_KEYS } from '@/constants/devices'
import { MetricCard } from './MetricCard'
import styles from './SummaryBar.module.css'

interface SummaryBarProps {
  summary: SiteSummary
  config: SiteConfig
}

/**
 * Top row of metric cards: budget, land, net energy, energy density.
 *
 * The empty state (all zeros) renders muted "—" placeholders rather than
 * "$0 / 0ft × 0ft / 0 MWh" — the latter reads as real data, the former
 * reads as "nothing yet."
 */
export function SummaryBar({ summary, config }: SummaryBarProps) {
  const totalBatteries = DEVICE_KEYS.reduce((sum, k) => sum + config.quantities[k], 0)
  const isEmpty = totalBatteries === 0

  return (
    <div className={styles.bar}>
      <MetricCard
        label="Total budget"
        value={isEmpty ? formatBudget(0) : formatBudget(summary.totalBudget)}
        subtitle={isEmpty ? 'Add devices to begin' : formatDeviceCount(totalBatteries)}
        muted={isEmpty}
      />
      <MetricCard
        label="Land required"
        value={formatLand(summary.siteWidthFt, summary.siteDepthFt)}
        subtitle={
          isEmpty
            ? undefined
            : `${(summary.siteWidthFt * summary.siteDepthFt).toLocaleString()} sq ft`
        }
        muted={isEmpty}
      />
      <MetricCard
        label="Net energy"
        value={isEmpty ? formatEnergy(0) : formatEnergy(summary.netEnergyMWh)}
        subtitle={
          isEmpty
            ? undefined
            : summary.transformerCount > 0
              ? `after ${summary.transformerCount} transformer${summary.transformerCount > 1 ? 's' : ''}`
              : 'no transformer needed'
        }
        positive={!isEmpty && summary.netEnergyMWh > 0}
        muted={isEmpty}
      />
      <MetricCard
        label="Energy density"
        value={
          isEmpty ? formatEnergyDensity(0) : formatEnergyDensity(summary.energyDensityKwhPerSqFt)
        }
        subtitle={isEmpty ? undefined : 'site footprint efficiency'}
        muted={isEmpty}
      />
    </div>
  )
}
