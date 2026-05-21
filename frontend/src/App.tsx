import { useState } from 'react'
import { useTerraGrid } from '@/hooks/useTerraGrid'
import { Header } from '@/components/Header/Header'
import { HeroSection } from '@/components/HeroSection/HeroSection'
import { SummaryBar } from '@/components/SummaryBar/SummaryBar'
import { ConfigPanel } from '@/components/ConfigPanel/ConfigPanel'
import { SiteLayoutCanvas } from '@/components/SiteLayoutCanvas/SiteLayoutCanvas'
import { LoadModal } from '@/components/LoadModal/LoadModal'
import { QuoteCTA } from '@/components/QuoteCTA/QuoteCTA'
import styles from './App.module.css'

export default function App() {
  const gf = useTerraGrid()
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
        sessionId={gf.sessionId}
        isSaving={gf.isSaving}
        lastSavedAt={gf.lastSavedAt}
        error={gf.error}
        onDismissError={gf.clearError}
      />

      <main className={styles.main}>
        <HeroSection
          onConfigureClick={handleConfigureClick}
          onLoadClick={() => setLoadOpen(true)}
        />

        <div id="planner" className={styles.planner}>
          <SummaryBar summary={gf.summary} config={gf.config} />

          <div className={styles.workspace}>
            <ConfigPanel
              config={gf.config}
              transformerCount={gf.summary.transformerCount}
              onQuantityChange={gf.setQuantity}
            />

            <SiteLayoutCanvas layout={gf.layout} summary={gf.summary} config={gf.config} />
          </div>
          <section id="support" className={styles.support}>
            <div>
              <p className={styles.supportEyebrow}>Support</p>
              <h2>Planning assumptions</h2>
              <p>
                TerraGrid automatically adds one transformer for every two batteries, calculates
                budget and net energy, and packs devices into a deterministic 100ft-wide site
                layout.
              </p>
            </div>

            <a href="#planner">Back to planner</a>
          </section>
        </div>
      </main>

      <LoadModal open={loadOpen} onClose={() => setLoadOpen(false)} onLoad={gf.loadSession} />

      <QuoteCTA sessionId={gf.sessionId} config={gf.config} summary={gf.summary} />
    </div>
  )
}
