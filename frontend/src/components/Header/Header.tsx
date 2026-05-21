import { useEffect, useState } from 'react'
import { LayoutDashboard, CircleHelp } from 'lucide-react'
import { formatRelativeTime } from '@/lib/format'
import styles from './Header.module.css'

interface HeaderProps {
  sessionId: string | null
  isSaving: boolean
  lastSavedAt: number | null
  error: string | null
  onDismissError: () => void
}

export function Header({ sessionId, isSaving, lastSavedAt, error, onDismissError }: HeaderProps) {
  const [, forceTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 15_000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <a className={styles.brandName} href="#" aria-label="TerraGrid home">
          TerraGrid
        </a>
      </div>

      <div className={styles.status} aria-live="polite">
        {error ? (
          <button className={styles.errorPill} type="button" onClick={onDismissError}>
            <span className={styles.errorDot} aria-hidden="true" />
            <span className={styles.errorText}>{error}</span>
            <span className={styles.errorDismiss} aria-hidden="true">
              ×
            </span>
          </button>
        ) : (
          <SaveStatus sessionId={sessionId} isSaving={isSaving} lastSavedAt={lastSavedAt} />
        )}
      </div>

      <nav className={styles.nav} aria-label="Primary navigation">
        <a className={styles.navLink} href="#planner" aria-label="Go to planner">
          <LayoutDashboard className={styles.navIcon} strokeWidth={1.8} />
          <span>Planner</span>
        </a>

        <a className={styles.navLink} href="#support" aria-label="Go to support">
          <CircleHelp className={styles.navIcon} strokeWidth={1.8} />
          <span>Support</span>
        </a>
      </nav>
    </header>
  )
}

interface SaveStatusProps {
  sessionId: string | null
  isSaving: boolean
  lastSavedAt: number | null
}

function SaveStatus({ sessionId, isSaving, lastSavedAt }: SaveStatusProps) {
  if (isSaving) {
    return (
      <span className={styles.statusText}>
        <span className={styles.statusDot} data-state="saving" aria-hidden="true" />
        Saving…
      </span>
    )
  }

  if (sessionId === null) {
    return (
      <span className={styles.statusText} data-muted>
        <span className={styles.statusDot} data-state="idle" aria-hidden="true" />
        Unsaved draft
      </span>
    )
  }

  const relative = formatRelativeTime(lastSavedAt)

  return (
    <span className={styles.statusText}>
      <span className={styles.statusDot} data-state="saved" aria-hidden="true" />
      Saved {relative ? `· ${relative}` : ''}
    </span>
  )
}
