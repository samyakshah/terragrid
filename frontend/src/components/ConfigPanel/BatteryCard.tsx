import type { DeviceType } from '@shared/types'
import { DEVICES } from '@/constants/devices'
import { formatBudget, formatEnergy } from '@/lib/format'
import { QuantityStepper } from './QuantityStepper'
import styles from './ConfigPanel.module.css'

interface BatteryCardProps {
  type: DeviceType
  quantity: number
  onQuantityChange: (next: number) => void
}

/**
 * One configurable battery type: visual proportional indicator, name, specs,
 * stepper. The visual width is proportional to the actual device width
 * relative to MegapackXL (the largest, 40ft = 100%).
 */
export function BatteryCard({ type, quantity, onQuantityChange }: BatteryCardProps) {
  const spec = DEVICES[type]
  const widthPct = (spec.widthFt / 40) * 100   // 40ft = full bar
  const isSelected = quantity > 0

  return (
    <div className={styles.card} data-selected={isSelected || undefined}>
      <div className={styles.cardVisual}>
        <div
          className={styles.cardVisualBar}
          data-type={type}
          style={{ width: `${widthPct}%` }}
          aria-hidden="true"
        />
      </div>

      <div className={styles.cardInfo}>
        <div className={styles.cardName}>{spec.name}</div>
        <div className={styles.cardSpecs}>
          <span>{spec.widthFt}×{spec.depthFt}ft</span>
          <span>{formatEnergy(spec.energyMWh)}</span>
          <span>{formatBudget(spec.cost)}</span>
        </div>
      </div>

      <QuantityStepper value={quantity} onChange={onQuantityChange} />
    </div>
  )
}