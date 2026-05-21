import { beforeEach, describe, expect, it } from 'vitest'
import { clearSessionIdFromUrl, readSessionIdFromUrl, writeSessionIdToUrl } from '@/lib/sessionUrl'

describe('sessionUrl helpers', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('returns null when no session id is present in the URL', () => {
    expect(readSessionIdFromUrl()).toBeNull()
  })

  it('writes and reads a session id from /session/:id', () => {
    writeSessionIdToUrl('abc-123')

    expect(window.location.pathname).toBe('/session/abc-123')
    expect(readSessionIdFromUrl()).toBe('abc-123')
  })

  it('clears the session id and returns to root', () => {
    writeSessionIdToUrl('abc-123')
    clearSessionIdFromUrl()

    expect(window.location.pathname).toBe('/')
    expect(readSessionIdFromUrl()).toBeNull()
  })

  it('ignores unrelated URL paths', () => {
    window.history.replaceState(null, '', '/not-a-session/abc-123')

    expect(readSessionIdFromUrl()).toBeNull()
  })
})
