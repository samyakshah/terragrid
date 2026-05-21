// A React component tree that renders to PDF via @react-pdf/renderer.
// Pages flow automatically; the layout diagram breaks naturally across pages.
import type { ReactNode } from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { LayoutRow, SiteConfig, SiteSummary } from '@shared/types'
import { DEVICE_KEYS, DEVICES, MAX_SITE_WIDTH_FT, TRANSFORMER } from '@/constants/devices'
import { formatBudget, formatEnergy, formatLand } from '@/lib/format'

interface SiteReportProps {
  layout: LayoutRow[]
  config: SiteConfig
  summary: SiteSummary
  generatedAt: Date
}

// Page geometry: US Letter portrait, 0.5" margins all around
const PAGE_PADDING = 36

const styles = StyleSheet.create({
  page: {
    padding: PAGE_PADDING,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#141820',
    backgroundColor: '#ffffff',
  },

  // Header
  brand: { fontSize: 9, fontWeight: 700, color: '#5e6168', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#5e6168', marginBottom: 18 },

  // Section
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e3e8',
  },

  // Two-column grid for summary cards
  cardGrid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  card: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f7f8fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e3e8',
  },
  cardLabel: {
    fontSize: 8,
    color: '#5e6168',
    fontWeight: 700,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  cardValue: { fontSize: 14, fontWeight: 700 },
  cardSub: { fontSize: 8, color: '#5e6168', marginTop: 2 },

  // Device table
  table: { marginTop: 4 },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f0f1f4',
    borderRadius: 3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e3e8',
  },
  th: { fontSize: 8, color: '#5e6168', fontWeight: 700, letterSpacing: 0.6 },
  td: { fontSize: 9, color: '#141820' },
  colName: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 2, textAlign: 'right' },
  colSubtotal: { flex: 2, textAlign: 'right' },

  // Layout
  layoutContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f7f8fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e3e8',
  },
  layoutRowLabel: { fontSize: 8, color: '#5e6168', marginBottom: 2 },
  layoutRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'center', gap: 2 },
  layoutRulerWrap: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  layoutRulerTick: { fontSize: 7, color: '#5e6168' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 18,
    left: PAGE_PADDING,
    right: PAGE_PADDING,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#9ea1a6',
  },
})

const DEVICE_COLORS: Record<string, string> = {
  megapackXL: '#1f6ab4',
  megapack2: '#147d5d',
  megapack: '#935c0b',
  powerPack: '#a0385e',
  transformer: '#3e424b',
}

function deviceName(type: string): string {
  if (type === 'transformer') return TRANSFORMER.name
  return DEVICES[type as keyof typeof DEVICES]?.name ?? type
}

export function SiteReport({ layout, config, summary, generatedAt }: SiteReportProps) {
  // Selected devices, with auto-injected transformer row appended
  const selectedDevices = DEVICE_KEYS.filter((key) => config.quantities[key] > 0).map((key) => ({
    name: DEVICES[key].name,
    quantity: config.quantities[key],
    unitCost: DEVICES[key].cost,
    subtotal: config.quantities[key] * DEVICES[key].cost,
  }))

  if (summary.transformerCount > 0) {
    selectedDevices.push({
      name: `${TRANSFORMER.name} (auto)`,
      quantity: summary.transformerCount,
      unitCost: TRANSFORMER.cost,
      subtotal: summary.transformerCount * TRANSFORMER.cost,
    })
  }

  const PdfPage = ({ children }: { children: ReactNode }) => (
    <Page size="LETTER" style={styles.page} wrap>
      {children}
      <View style={styles.footer} fixed>
        <Text>TerraGrid Site Layout Report</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  )

  return (
    <Document title="TerraGrid Site Layout Report" author="TerraGrid" creator="TerraGrid">
      <PdfPage>
        {/* Title block */}
        <Text style={styles.brand}>TERRAGRID</Text>
        <Text style={styles.title}>Site Layout Report</Text>
        <Text style={styles.subtitle}>Generated {generatedAt.toLocaleString()}</Text>

        {/* Summary cards — two rows of two */}
        <Text style={styles.sectionTitle}>Site summary</Text>
        <View style={styles.cardGrid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>TOTAL BUDGET</Text>
            <Text style={styles.cardValue}>{formatBudget(summary.totalBudget)}</Text>
            <Text style={styles.cardSub}>
              {selectedDevices.length} line item{selectedDevices.length === 1 ? '' : 's'}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>LAND REQUIRED</Text>
            <Text style={styles.cardValue}>
              {formatLand(summary.siteWidthFt, summary.siteDepthFt)}
            </Text>
            <Text style={styles.cardSub}>
              {(summary.siteWidthFt * summary.siteDepthFt).toLocaleString()} sq ft
            </Text>
          </View>
        </View>
        <View style={styles.cardGrid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>NET ENERGY</Text>
            <Text style={[styles.cardValue, { color: '#1d9e75' }]}>
              {formatEnergy(summary.netEnergyMWh)}
            </Text>
            <Text style={styles.cardSub}>
              after {summary.transformerCount} transformer
              {summary.transformerCount === 1 ? '' : 's'}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>BATTERY COUNT</Text>
            <Text style={styles.cardValue}>
              {DEVICE_KEYS.reduce((sum, key) => sum + config.quantities[key], 0)}
            </Text>
            <Text style={styles.cardSub}>
              across {selectedDevices.length - (summary.transformerCount > 0 ? 1 : 0)} device{' '}
              {selectedDevices.length - (summary.transformerCount > 0 ? 1 : 0) === 1
                ? 'type'
                : 'types'}
            </Text>
          </View>
        </View>

        {/* Bill of materials */}
        <Text style={styles.sectionTitle}>Bill of materials</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colName]}>DEVICE</Text>
            <Text style={[styles.th, styles.colQty]}>QTY</Text>
            <Text style={[styles.th, styles.colUnit]}>UNIT COST</Text>
            <Text style={[styles.th, styles.colSubtotal]}>SUBTOTAL</Text>
          </View>
          {selectedDevices.map((row, i) => (
            <View key={i} style={styles.tableRow} wrap={false}>
              <Text style={[styles.td, styles.colName]}>{row.name}</Text>
              <Text style={[styles.td, styles.colQty]}>{row.quantity}</Text>
              <Text style={[styles.td, styles.colUnit]}>{formatBudget(row.unitCost)}</Text>
              <Text style={[styles.td, styles.colSubtotal]}>{formatBudget(row.subtotal)}</Text>
            </View>
          ))}
          <View style={[styles.tableRow, { borderBottomWidth: 0, paddingTop: 10 }]}>
            <Text style={[styles.td, styles.colName, { fontWeight: 700 }]}>Total</Text>
            <Text style={[styles.td, styles.colQty]}></Text>
            <Text style={[styles.td, styles.colUnit]}></Text>
            <Text style={[styles.td, styles.colSubtotal, { fontWeight: 700 }]}>
              {formatBudget(summary.totalBudget)}
            </Text>
          </View>
        </View>

        {/* Layout diagram — wrap=true on Page means rows page-break naturally */}
        <Text style={styles.sectionTitle}>Auto-generated layout</Text>
        <Text style={{ fontSize: 8, color: '#5e6168', marginBottom: 8 }}>
          Devices are packed left-to-right into rows, each capped at 100ft wide. Every row
          represents 10ft of site depth.
        </Text>

        <View style={styles.layoutContainer}>
          {layout.map((row, rowIndex) => {
            // Available drawing width inside the container
            const innerWidth = 540 - 20 // page content width ≈ 540 at LETTER w/ 36pt margins; minus container padding
            const scale = innerWidth / MAX_SITE_WIDTH_FT

            return (
              <View key={rowIndex} wrap={false}>
                <Text style={styles.layoutRowLabel}>
                  Row {rowIndex + 1} — {row.totalWidthFt}ft used
                </Text>
                <View style={styles.layoutRow}>
                  {row.devices.map((device, dIdx) => {
                    const w = device.widthFt * scale
                    return (
                      <View
                        key={dIdx}
                        style={{
                          width: w,
                          height: 26,
                          backgroundColor: DEVICE_COLORS[device.type] ?? '#3e424b',
                          borderRadius: 2,
                          opacity: device.isTransformer ? 0.6 : 1,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        {w > 40 ? (
                          <Text style={{ fontSize: 7, color: '#fff', fontWeight: 700 }}>
                            {deviceName(device.type)}
                          </Text>
                        ) : (
                          <Text style={{ fontSize: 6, color: '#fff', fontWeight: 700 }}>
                            {device.isTransformer ? 'T' : deviceName(device.type)[0]}
                          </Text>
                        )}
                      </View>
                    )
                  })}
                </View>
              </View>
            )
          })}
          <View style={styles.layoutRulerWrap}>
            <Text style={styles.layoutRulerTick}>0 ft</Text>
            <Text style={styles.layoutRulerTick}>25 ft</Text>
            <Text style={styles.layoutRulerTick}>50 ft</Text>
            <Text style={styles.layoutRulerTick}>75 ft</Text>
            <Text style={styles.layoutRulerTick}>100 ft</Text>
          </View>
        </View>

        <Text style={{ fontSize: 7, color: '#9ea1a6', marginTop: 16 }}>
          This report is a planning estimate. Production deployment may require service clearances,
          fire lanes, transformer adjacency rules, and jurisdiction-specific review.
        </Text>
      </PdfPage>
    </Document>
  )
}
