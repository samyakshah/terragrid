import { useState } from 'react'
import { useTerraGrid } from '@/hooks/useTerraGrid'
import { Header } from '@/components/Header/Header'
import { HeroSection } from '@/components/HeroSection/HeroSection'
import { SummaryBar } from '@/components/SummaryBar/SummaryBar'
import { ConfigPanel } from '@/components/ConfigPanel/ConfigPanel'
import { SiteLayoutCanvas } from '@/components/SiteLayoutCanvas/SiteLayoutCanvas'
import { LoadModal } from '@/components/LoadModal/LoadModal'
import { QuoteCTA } from '@/components/QuoteCTA/QuoteCTA'
import { SupportCard } from '@/components/SupportCard/SupportCard'
import styles from './App.module.css'

export default function App() {
  const terraGrid = useTerraGrid()
  const [loadOpen, setLoadOpen] = useState(false)

  /**
   * Configure Site should only move the user into the planner.
   *
   * We intentionally do NOT create a session here.
   * A session is created later by the existing autosave flow once the user
   * selects at least one battery quantity.
   */
  const handleConfigureClick = () => {
    document.getElementById('planner')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <div className={styles.app}>
      <Header
        sessionId={terraGrid.sessionId}
        isSaving={terraGrid.isSaving}
        lastSavedAt={terraGrid.lastSavedAt}
        error={terraGrid.error}
        onDismissError={terraGrid.clearError}
      />

      <main className={styles.main}>
        <HeroSection
          onConfigureClick={handleConfigureClick}
          onLoadClick={() => setLoadOpen(true)}
        />

        <div id="planner" className={styles.planner}>
          <SummaryBar summary={terraGrid.summary} config={terraGrid.config} />

          <div className={styles.workspace}>
            <ConfigPanel
              config={terraGrid.config}
              transformerCount={terraGrid.summary.transformerCount}
              onQuantityChange={terraGrid.setQuantity}
            />

            <SiteLayoutCanvas
              layout={terraGrid.layout}
              summary={terraGrid.summary}
              config={terraGrid.config}
            />
          </div>
        </div>
        <SupportCard />
      </main>

      <LoadModal
        open={loadOpen}
        onClose={() => setLoadOpen(false)}
        onLoad={terraGrid.loadSession}
      />

      <QuoteCTA
        sessionId={terraGrid.sessionId}
        config={terraGrid.config}
        summary={terraGrid.summary}
      />
    </div>
  )
}
