import styles from './SummaryBar.module.css'

interface MetricCardProps {
  label: string
  value: string
  subtitle?: string
  /** When true, render value in success green (used for positive net energy). */
  positive?: boolean
  /** When true, render value muted (empty-state placeholder). */
  muted?: boolean
}

/**
 * One stat card in the SummaryBar.
 *
 * The card is presentational only — it takes pre-formatted strings, not raw
 * numbers, so the SummaryBar can decide how to format and the card stays dumb.
 */
export function MetricCard({ label, value, subtitle, positive, muted }: MetricCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.label}>{label}</div>
      <div
        className={styles.value}
        data-positive={positive || undefined}
        data-muted={muted || undefined}
      >
        {value}
      </div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </div>
  )
}