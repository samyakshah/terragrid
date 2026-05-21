/**
 * Manages the session ID in the browser URL.
 *
 * Format: /session/<uuid>
 * Root (/) means "no session yet — saving will create one".
 *
 * Uses history.replaceState to update the URL without reloading the page.
 * No router needed — this is the only URL pattern in the app.
 */

const PREFIX = '/session/'

/** Returns the session ID from the URL, or null if at root. */
export function readSessionIdFromUrl(): string | null {
  const path = window.location.pathname
  if (!path.startsWith(PREFIX)) return null
  const id = path.slice(PREFIX.length)
  return id.length > 0 ? id : null
}

/** Writes the session ID into the URL without a navigation. */
export function writeSessionIdToUrl(id: string): void {
  const target = `${PREFIX}${id}`
  if (window.location.pathname !== target) {
    window.history.replaceState(null, '', target)
  }
}

/** Clears the session ID, returning the URL to root. */
export function clearSessionIdFromUrl(): void {
  if (window.location.pathname !== '/') {
    window.history.replaceState(null, '', '/')
  }
}