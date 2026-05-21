import styles from './ConfigPanel.module.css'

interface TransformerNoteProps {
  count: number
}

/**
 * Read-only note showing the auto-injected transformer count and the rule.
 * Users can't add transformers manually — they're derived from battery count.
 */
export function TransformerNote({ count }: TransformerNoteProps) {
  return (
    <div className={styles.transformer}>
      <div className={styles.transformerInfo}>
        <div className={styles.transformerLabel}>
          Transformer
          <span className={styles.transformerBadge}>AUTO</span>
        </div>
        <div className={styles.transformerHint}>
          {count === 0
            ? '1 added per battery group'
            : `1 added per group of 2 batteries`}
        </div>
      </div>
      <div className={styles.transformerCount}>{count}</div>
    </div>
  )
}