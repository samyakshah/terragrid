import { useRef, useState } from 'react'
import type {
  LayoutRow,
  SiteSummary,
  DevicePlacement,
  PlacementType,
  SiteConfig,
} from '@shared/types'
import { DEVICES, MAX_SITE_WIDTH_FT, TRANSFORMER } from '@/constants/devices'
import { formatBudget, formatNumber } from '@/lib/format'
import { exportLayoutPdf } from '@/utils/exportPDF'
import { SiteLayoutLegend } from './SiteLayoutLegend'
import styles from './SiteLayoutCanvas.module.css'

interface SiteLayoutCanvasProps {
  layout: LayoutRow[]
  summary: SiteSummary
  config: SiteConfig
}

const ROW_DEPTH_FT = 10
const GRID_STEP_FT = 10
const MIN_CANVAS_DEPTH_FT = 10

const ABBREVIATED_DEVICE_LABELS: Record<PlacementType, string> = {
  megapackXL: 'MXL',
  megapack2: 'M2',
  megapack: 'MP',
  powerPack: 'PP',
  transformer: 'TX',
}

function getDeviceName(type: PlacementType): string {
  return type === 'transformer' ? TRANSFORMER.name : DEVICES[type].name
}

function getDeviceEnergy(type: PlacementType): number {
  return type === 'transformer' ? TRANSFORMER.energyMWh : DEVICES[type].energyMWh
}

function getDeviceCost(type: PlacementType): number {
  return type === 'transformer' ? TRANSFORMER.cost : DEVICES[type].cost
}

function buildDeviceAccessibilityLabel(device: DevicePlacement, rowIndex: number): string {
  const name = getDeviceName(device.type)
  const energy = getDeviceEnergy(device.type)
  const cost = getDeviceCost(device.type)

  return [
    `${name} in row ${rowIndex + 1}`,
    `${device.widthFt} feet by ${device.depthFt} feet`,
    `${energy} megawatt hours`,
    formatBudget(cost),
  ].join(', ')
}

function getGridLines(maxValue: number): number[] {
  const lines: number[] = []

  for (let value = 0; value <= maxValue; value += GRID_STEP_FT) {
    lines.push(value)
  }

  return lines
}

export function SiteLayoutCanvas({ layout, summary, config }: SiteLayoutCanvasProps) {
  const exportRef = useRef<HTMLDivElement | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const hasLayout = layout.length > 0
  const canvasDepthFt = Math.max(summary.siteDepthFt, MIN_CANVAS_DEPTH_FT)
  const verticalGridLines = getGridLines(MAX_SITE_WIDTH_FT)
  const horizontalGridLines = getGridLines(canvasDepthFt)

  const totalUsedWidthFt = layout.reduce((sum, row) => sum + row.totalWidthFt, 0)
  const totalCapacityFt = Math.max(layout.length * MAX_SITE_WIDTH_FT, 1)
  const packingEfficiency = hasLayout ? Math.round((totalUsedWidthFt / totalCapacityFt) * 100) : 0

  const energyDensity =
    'energyDensityKwhPerSqFt' in summary
      ? `${summary.energyDensityKwhPerSqFt.toFixed(2)} kWh / sq ft`
      : '0.00 kWh / sq ft'

  const handleDownloadPdf = async () => {
    if (!exportRef.current || !hasLayout) return

    setIsExporting(true)

    try {
      await exportLayoutPdf({
        layout,
        config,
        summary,
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="site-layout-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Site Layout</p>
          <h2 id="site-layout-title" className={styles.title}>
            Auto-generated layout
          </h2>
          <p className={styles.description}>
            Devices are packed left-to-right into rows. Each row is capped at 100ft wide and
            represents 10ft of site depth.
          </p>
        </div>

        <div className={styles.headerActions} aria-label="Layout actions and metrics">
          <div className={styles.metrics} aria-label="Layout metrics">
            <div className={styles.metricPill}>
              <span>Width used</span>
              <strong>{summary.siteWidthFt}ft</strong>
            </div>

            <div className={styles.metricPill}>
              <span>Depth</span>
              <strong>{summary.siteDepthFt}ft</strong>
            </div>

            <div className={styles.metricPill}>
              <span>Area</span>
              <strong>{formatNumber(summary.siteWidthFt * summary.siteDepthFt)} sq ft</strong>
            </div>
          </div>

          <button
            type="button"
            className={styles.downloadButton}
            onClick={handleDownloadPdf}
            disabled={!hasLayout || isExporting}
            data-export-ignore="true"
          >
            {isExporting ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </div>
      </header>

      {!hasLayout ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">
            ▣
          </div>
          <h3>No devices selected</h3>
          <p>
            Add batteries from the configuration panel to generate a dimensionally scaled site
            layout.
          </p>
        </div>
      ) : (
        <div ref={exportRef} className={styles.exportSurface}>
          <div className={styles.ruler} aria-hidden="true">
            <span>0ft</span>
            <span>25ft</span>
            <span>50ft</span>
            <span>75ft</span>
            <span>100ft max</span>
          </div>

          <div className={styles.canvasFrame}>
            <svg
              className={styles.svg}
              viewBox={`0 0 ${MAX_SITE_WIDTH_FT} ${canvasDepthFt}`}
              role="img"
              aria-label={`Generated site layout. Width ${summary.siteWidthFt} feet, depth ${summary.siteDepthFt} feet, ${layout.length} rows.`}
              preserveAspectRatio="xMinYMin meet"
            >
              <defs>
                <filter id="deviceShadow" x="-10%" y="-20%" width="120%" height="150%">
                  <feDropShadow dx="0" dy="0.45" stdDeviation="0.45" floodOpacity="0.28" />
                </filter>
              </defs>

              <rect
                className={styles.siteBoundary}
                x="0"
                y="0"
                width={MAX_SITE_WIDTH_FT}
                height={canvasDepthFt}
                rx="1"
              />

              {verticalGridLines.map((x) => (
                <line
                  key={`v-${x}`}
                  className={x === MAX_SITE_WIDTH_FT ? styles.limitLine : styles.gridLine}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2={canvasDepthFt}
                />
              ))}

              {horizontalGridLines.map((y) => (
                <line
                  key={`h-${y}`}
                  className={styles.gridLine}
                  x1="0"
                  y1={y}
                  x2={MAX_SITE_WIDTH_FT}
                  y2={y}
                />
              ))}

              {layout.map((row, rowIndex) => {
                let cursorX = 0
                const rowY = rowIndex * ROW_DEPTH_FT

                return row.devices.map((device, deviceIndex) => {
                  const x = cursorX
                  const y = rowY
                  cursorX += device.widthFt

                  const name = getDeviceName(device.type)
                  const compact = device.widthFt <= 10
                  const label = compact ? ABBREVIATED_DEVICE_LABELS[device.type] : name
                  const ariaLabel = buildDeviceAccessibilityLabel(device, rowIndex)

                  return (
                    <g
                      key={`${rowIndex}-${deviceIndex}-${device.type}`}
                      className={styles.deviceGroup}
                      tabIndex={0}
                      role="listitem"
                      aria-label={ariaLabel}
                    >
                      <title>{ariaLabel}</title>

                      <rect
                        className={styles.deviceRect}
                        data-type={device.type}
                        x={x + 0.6}
                        y={y + 0.6}
                        width={Math.max(device.widthFt - 1.2, 0)}
                        height={Math.max(device.depthFt - 1.2, 0)}
                        rx="1.1"
                        filter="url(#deviceShadow)"
                      />

                      <text
                        className={styles.deviceLabel}
                        x={x + device.widthFt / 2}
                        y={y + device.depthFt / 2 - (compact ? 0 : 1.1)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {label}
                      </text>

                      {!compact && (
                        <text
                          className={styles.deviceSubLabel}
                          x={x + device.widthFt / 2}
                          y={y + device.depthFt / 2 + 2.2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {device.widthFt}ft × {device.depthFt}ft
                        </text>
                      )}
                    </g>
                  )
                })
              })}
            </svg>
          </div>

          <div className={styles.footer}>
            <SiteLayoutLegend />
            <p className={styles.footnote}>
              Layout is deterministic and dimensionally scaled. Production planning could add
              service clearances, fire lanes, and transformer adjacency rules.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
