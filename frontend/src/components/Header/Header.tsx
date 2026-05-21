import { useEffect, useState } from 'react'
import { formatRelativeTime } from '@/lib/format'
import styles from './Header.module.css'

interface HeaderProps {
  sessionId: string | null
  isSaving: boolean
  lastSavedAt: number | null
  error: string | null
  onLoadClick: () => void
  onNewSite: () => void
  onDismissError: () => void
}

/**
 * Top bar: brand mark on the left, save status in the middle, actions on the right.
 *
 * Save status is the only piece of UI that needs a periodic re-render to keep
 * "Saved · 2m ago" current. We tick once every 15 seconds — fine-grained enough
 * to feel live, infrequent enough to be invisible to React's render budget.
 */
export function Header({
  sessionId,
  isSaving,
  lastSavedAt,
  error,
  onLoadClick,
  onNewSite,
  onDismissError,
}: HeaderProps) {
  const [, forceTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 15_000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>◆</span>
        <span className={styles.brandName}>TerraGrid</span>
      </div>

      <div className={styles.status} aria-live="polite">
        {error ? (
          <button className={styles.errorPill} onClick={onDismissError}>
            <span className={styles.errorDot} aria-hidden="true" />
            {error}
            <span className={styles.errorDismiss} aria-hidden="true">×</span>
          </button>
        ) : (
          <SaveStatus sessionId={sessionId} isSaving={isSaving} lastSavedAt={lastSavedAt} />
        )}
      </div>

      <div className={styles.actions}>
        <button className={styles.btnSecondary} onClick={onLoadClick}>
          Load session
        </button>
        <button className={styles.btnPrimary} onClick={onNewSite}>
          New site
        </button>
      </div>
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
      Saved {relative && `· ${relative}`}
    </span>
  )
}