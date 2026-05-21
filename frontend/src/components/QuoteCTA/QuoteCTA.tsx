import { useState } from 'react'
import type { SiteConfig, SiteSummary } from '@shared/types'
import { DEVICE_KEYS } from '@/constants/devices'
import { formatBudget } from '@/lib/format'
import { QuoteDrawer } from './QuoteDrawer'
import styles from './QuoteCTA.module.css'

interface QuoteCTAProps {
  sessionId: string | null
  config: SiteConfig
  summary: SiteSummary
}

/**
 * Sticky CTA bar pinned to the bottom of the viewport.
 */
export function QuoteCTA({ sessionId, config, summary }: QuoteCTAProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const totalBatteries = DEVICE_KEYS.reduce((sum, k) => sum + config.quantities[k], 0)
  const isReady = totalBatteries > 0

  return (
    <>
      <div className={styles.barWrap} data-visible={isReady || undefined}>
        <div className={styles.bar}>
          <div className={styles.left}>
            <span className={styles.label}>Site total</span>
            <span className={styles.total}>{formatBudget(summary.totalBudget)}</span>
            <span className={styles.divider} aria-hidden="true" />
            <span className={styles.hint}>
              {totalBatteries} {totalBatteries === 1 ? 'battery' : 'batteries'} ·{' '}
              {summary.transformerCount}{' '}
              {summary.transformerCount === 1 ? 'transformer' : 'transformers'}
            </span>
          </div>

          <button
            type="button"
            className={styles.cta}
            onClick={() => setDrawerOpen(true)}
            disabled={!isReady}
          >
            Request quote
          </button>
        </div>
      </div>

      <QuoteDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sessionId={sessionId}
        config={config}
        summary={summary}
      />
    </>
  )
}
