import type { DeviceType } from '@shared/types'
import { DEVICES } from '@/constants/devices'
import { formatBudget, formatEnergy } from '@/lib/format'
import { QuantityStepper } from './QuantityStepper'
import styles from './ConfigPanel.module.css'

interface BatteryCardProps {
  type: DeviceType
  quantity: number

  // Max allowed for this specific device input after considering
  // the total 1000-device limit across all selected battery types.
  // Auto-derived transformers are excluded from this limit.
  maxAllowed: number

  onQuantityChange: (next: number) => void
}

/**
 * One configurable battery type with a proportional visual indicator,
 * device specs, and quantity input.
 */
export function BatteryCard({ type, quantity, maxAllowed, onQuantityChange }: BatteryCardProps) {
  const spec = DEVICES[type]
  const widthPct = (spec.widthFt / 40) * 100 // 40ft = full bar
  const isSelected = quantity > 0

  return (
    <div className={styles.card} data-selected={isSelected || undefined}>
      <div className={styles.cardVisual} aria-hidden="true">
        <div className={styles.cardVisualBar} data-type={type} style={{ width: `${widthPct}%` }} />
      </div>

      <div className={styles.cardInfo}>
        <div className={styles.cardName}>{spec.name}</div>

        <div className={styles.cardSpecs}>
          <span>
            {spec.widthFt}×{spec.depthFt}ft
          </span>
          <span>{formatEnergy(spec.energyMWh)}</span>
          <span>{formatBudget(spec.cost)}</span>
        </div>
      </div>

      <QuantityStepper value={quantity} maxAllowed={maxAllowed} onChange={onQuantityChange} />
    </div>
  )
}
