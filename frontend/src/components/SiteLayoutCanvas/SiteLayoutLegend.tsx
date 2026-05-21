import styles from './SiteLayoutCanvas.module.css'

const legendItems = [
  { label: 'MegapackXL', type: 'megapackXL' },
  { label: 'Megapack 2', type: 'megapack2' },
  { label: 'Megapack', type: 'megapack' },
  { label: 'PowerPack', type: 'powerPack' },
  { label: 'Transformer', type: 'transformer' },
] as const

export function SiteLayoutLegend() {
  return (
    <div className={styles.legend} aria-label="Layout legend">
      {legendItems.map((item) => (
        <div key={item.type} className={styles.legendItem}>
          <span className={styles.legendSwatch} data-type={item.type} aria-hidden="true" />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}