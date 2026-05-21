import { useState } from 'react'
import { useTerraGrid } from '@/hooks/useTerraGrid'
import { Header } from '@/components/Header/Header'
import { SummaryBar } from '@/components/SummaryBar/SummaryBar'
import { ConfigPanel } from '@/components/ConfigPanel/ConfigPanel'
import { SiteLayoutCanvas } from '@/components/SiteLayoutCanvas/SiteLayoutCanvas'
import { LoadModal } from '@/components/LoadModal/LoadModal'
import styles from './App.module.css'

export default function App() {
  const gf = useTerraGrid()
  const [loadOpen, setLoadOpen] = useState(false)

  return (
    <div className={styles.app}>
      <Header
        sessionId={gf.sessionId}
        isSaving={gf.isSaving}
        lastSavedAt={gf.lastSavedAt}
        error={gf.error}
        onLoadClick={() => setLoadOpen(true)}
        onNewSite={gf.newSession}
        onDismissError={gf.clearError}
      />

      <main className={styles.main}>
        <SummaryBar summary={gf.summary} config={gf.config} />

        <div className={styles.workspace}>
          <ConfigPanel
            config={gf.config}
            transformerCount={gf.summary.transformerCount}
            onQuantityChange={gf.setQuantity}
          />
          <SiteLayoutCanvas layout={gf.layout} summary={gf.summary} />
        </div>
      </main>

      <LoadModal open={loadOpen} onClose={() => setLoadOpen(false)} onLoad={gf.loadSession} />
    </div>
  )
}
