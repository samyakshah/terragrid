/**
 * Display formatters for TerraGrid metrics.
 *
 * All numbers shown to the user pass through these. Centralising format logic
 * keeps the UI consistent and the calculator free of presentation concerns.
 */

/** "$240,000" — no decimals, US locale. */
export function formatBudget(usd: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(usd)
}

/**
 * "7.5 MWh" — one decimal when fractional, no decimal when whole.
 * Negative energy renders with a minus sign: "−0.5 MWh".
 */
export function formatEnergy(mwh: number): string {
  const isWhole = mwh % 1 === 0
  return `${isWhole ? mwh.toFixed(0) : mwh.toFixed(1)} MWh`
}

/**
 * "90ft × 10ft" — width × depth in feet, or "—" when the site is empty.
 * Em-dash is the convention for "no data yet" rather than "0ft × 0ft".
 */
export function formatLand(widthFt: number, depthFt: number): string {
  if (widthFt === 0 || depthFt === 0) return '—'
  return `${widthFt}ft × ${depthFt}ft`
}

/** Format an integer with locale-aware thousand separators: 2498 → "2,498". */
export function formatNumber(count: number): string {
  return count.toLocaleString('en-US')
}

export function formatEnergyDensity(value: number): string {
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: value === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} kWh / sq ft`
}

/**
 * "2 batteries" / "1 battery" — small humanising touch for metric subtitles.
 * Returns empty string for zero, since "0 batteries" alongside "$0" is noise.
 */
export function formatDeviceCount(count: number): string {
  if (count === 0) return ''
  return count === 1 ? '1 battery' : `${count} batteries`
}

/**
 * "Saved · just now" / "Saved · 2m ago" — relative time for the header.
 * Returns null when timestamp is null so the caller can render nothing.
 */
export function formatRelativeTime(timestamp: number | null): string | null {
  if (timestamp === null) return null

  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  return new Date(timestamp).toLocaleDateString()
}
