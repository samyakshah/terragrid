import type { DeviceType, SiteConfig } from '@shared/types'
import { DEVICE_KEYS, DEVICES } from '@/constants/devices'
import { TOTAL_BATTERY_QUANTITY_MAX } from '@/constants/validation'
import { BatteryCard } from './BatteryCard'
import { TransformerNote } from './TransformerNote'
import styles from './ConfigPanel.module.css'

interface ConfigPanelProps {
  config: SiteConfig
  transformerCount: number
  onQuantityChange: (deviceType: DeviceType, quantity: number) => void
}

export function ConfigPanel({ config, transformerCount, onQuantityChange }: ConfigPanelProps) {
  /**
   * Total user-selected battery count across all selectable battery types.
   *
   * Important:
   * - This does NOT include transformers.
   * - Transformers are auto-derived by the layout/calculation engine.
   * - The assignment limit we are enforcing here is max 1000 selected battery devices.
   */
  const totalSelectedBatteryCount = DEVICE_KEYS.reduce(
    (sum, deviceType) => sum + config.quantities[deviceType],
    0,
  )

  /**
   * Remaining capacity across all selectable batteries.
   *
   * Example:
   * - Max allowed = 1000
   * - Current total = 950
   * - Remaining = 50
   */
  const remainingBatteryCapacity = Math.max(
    0,
    TOTAL_BATTERY_QUANTITY_MAX - totalSelectedBatteryCount,
  )

  return (
    <section className={styles.panel} aria-labelledby="config-panel-title">
      <h2 id="config-panel-title" className={styles.title}>
        Configure devices
      </h2>

      <div className={styles.cards}>
        {DEVICE_KEYS.map((deviceType) => {
          const currentQuantity = config.quantities[deviceType]

          /**
           * Max allowed for this specific device input.
           *
           * We allow the device to keep its current quantity and only limit how much
           * additional quantity it can add based on the remaining global capacity.
           *
           * Example:
           * - Total selected = 950
           * - MegapackXL currently = 200
           * - Remaining global capacity = 50
           * - MegapackXL input can go up to 250
           *
           * This prevents accidental invalid behavior where a user could not edit
           * an existing non-zero value.
           */
          const maxAllowedForThisDevice = currentQuantity + remainingBatteryCapacity

          return (
            <BatteryCard
              key={deviceType}
              type={deviceType}
              quantity={currentQuantity}
              maxAllowed={maxAllowedForThisDevice}
              onQuantityChange={(quantity) => onQuantityChange(deviceType, quantity)}
            />
          )
        })}
      </div>

      <TransformerNote count={transformerCount} />
    </section>
  )
}
