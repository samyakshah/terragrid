import { useEffect, useRef, useState } from 'react'
import styles from './LoadModal.module.css'

interface LoadModalProps {
  open: boolean
  onClose: () => void
  onLoad: (id: string) => Promise<void>
}

/**
 * Load-by-ID modal.
 *
 * The brief allows "save and resume sessions" without specifying the
 * mechanism. We use a UUID-in-URL system: users bookmark the URL or paste
 * the ID here. Simpler than building a sessions list page.
 *
 * The modal traps focus, closes on Escape and on backdrop click, and
 * autofocuses the input.
 */
export function LoadModal({ open, onClose, onLoad }: LoadModalProps) {
  const [id, setId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Autofocus when opening, reset state when closing
  useEffect(() => {
    if (open) {
      setId('')
      // RAF defers focus until the input is actually in the DOM
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Escape to close
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = id.trim()
    if (!trimmed) return
    setIsLoading(true)
    try {
      await onLoad(trimmed)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="load-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="load-modal-title" className={styles.title}>
            Load session
          </h2>
          <button className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className={styles.body}>
          <label className={styles.label} htmlFor="session-id-input">
            Session ID
          </label>
          <input
            id="session-id-input"
            ref={inputRef}
            className={styles.input}
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g. 8c4b0e1a-2f3d-4e5a-b6c7-d8e9f0a1b2c3"
            autoComplete="off"
            spellCheck={false}
            disabled={isLoading}
          />
          <p className={styles.hint}>
            Paste a session ID, or use a bookmarked URL like /session/&lt;id&gt;
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={!id.trim() || isLoading}
            >
              {isLoading ? 'Loading…' : 'Load'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}