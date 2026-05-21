import type { DeviceType, SiteConfig } from '@shared/types'
import { DEVICE_KEYS } from '@/constants/devices'
import { BatteryCard } from './BatteryCard'
import { TransformerNote } from './TransformerNote'
import styles from './ConfigPanel.module.css'

interface ConfigPanelProps {
  config: SiteConfig
  transformerCount: number
  onQuantityChange: (type: DeviceType, next: number) => void
}

/**
 * Left column. Lists the four battery types as configurable cards, with
 * the auto-injected transformer count shown below.
 */
export function ConfigPanel({ config, transformerCount, onQuantityChange }: ConfigPanelProps) {
  return (
    <aside className={styles.panel}>
      <h2 className={styles.title}>Devices</h2>

      <div className={styles.cards}>
        {DEVICE_KEYS.map((type) => (
          <BatteryCard
            key={type}
            type={type}
            quantity={config.quantities[type]}
            onQuantityChange={(next) => onQuantityChange(type, next)}
          />
        ))}
      </div>

      <TransformerNote count={transformerCount} />
    </aside>
  )
}