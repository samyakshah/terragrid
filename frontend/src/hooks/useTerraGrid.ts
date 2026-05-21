import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DeviceType, SiteConfig, LayoutRow, SiteSummary } from '@shared/types'
import { EMPTY_CONFIG } from '@/constants/devices'
import { computeLayout } from '@/utils/layoutEngine'
import { calculateSummary } from '@/utils/calculator'
import * as api from '@/lib/api'
import { ApiError } from '@/lib/api'
import { readSessionIdFromUrl, writeSessionIdToUrl, clearSessionIdFromUrl } from '@/lib/sessionUrl'
import { TOTAL_BATTERY_QUANTITY_MAX } from '@/constants/validation'

/**
 * The single source of truth for TerraGrid's runtime state.
 *
 * Components do not call the API, the layout engine, or the calculator
 * directly. They receive everything from this hook and dispatch actions back
 * through it. This keeps state transitions in one place — easy to reason
 * about, easy to test.
 *
 * Save is debounced 500ms: rapid quantity changes coalesce into one network
 * request. The first save creates a session (POST) and rewrites the URL;
 * subsequent saves update it (PUT).
 */

const SAVE_DEBOUNCE_MS = 500

interface UseTerraGrid {
  // State
  config: SiteConfig
  layout: LayoutRow[]
  summary: SiteSummary
  sessionId: string | null
  sessionName: string
  isSaving: boolean
  isLoading: boolean
  lastSavedAt: number | null
  error: string | null

  // Actions
  setQuantity: (type: DeviceType, qty: number) => void
  setSessionName: (name: string) => void
  loadSession: (id: string) => Promise<void>
  newSession: () => void
  clearError: () => void
}

export function useTerraGrid(): UseTerraGrid {
  const [config, setConfig] = useState<SiteConfig>(EMPTY_CONFIG)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionName, setSessionNameState] = useState<string>('Untitled site')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Refs to expose the latest values inside the debounced save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestConfig = useRef(config)
  const latestName = useRef(sessionName)
  const latestId = useRef(sessionId)

  useEffect(() => {
    latestConfig.current = config
  }, [config])
  useEffect(() => {
    latestName.current = sessionName
  }, [sessionName])
  useEffect(() => {
    latestId.current = sessionId
  }, [sessionId])

  // Derived state (recomputed when config changes)

  const layout = useMemo(() => computeLayout(config), [config])
  const summary = useMemo(() => calculateSummary(config, layout), [config, layout])

  // Save (debounced)

  const performSave = useCallback(async () => {
    setIsSaving(true)
    setError(null)
    try {
      const id = latestId.current
      const cfg = latestConfig.current
      const name = latestName.current

      if (id === null) {
        const { sessionId: newId } = await api.createSession({ name, config: cfg })
        setSessionId(newId)
        writeSessionIdToUrl(newId)
      } else {
        await api.updateSession(id, { name, config: cfg })
      }
      setLastSavedAt(Date.now())
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Save failed'
      setError(msg)
    } finally {
      setIsSaving(false)
    }
  }, [])

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(performSave, SAVE_DEBOUNCE_MS)
  }, [performSave])

  // Actions
  const setQuantity = useCallback(
    (deviceType: DeviceType, qty: number) => {
      setConfig((prev) => {
        const normalizedQty = Math.max(0, Math.floor(qty))

        const currentTotal = Object.entries(prev.quantities).reduce((sum, [key, value]) => {
          if (key === deviceType) return sum
          return sum + value
        }, 0)

        const maxAllowedForThisDevice = Math.max(0, TOTAL_BATTERY_QUANTITY_MAX - currentTotal)

        const safeQty = Math.min(normalizedQty, maxAllowedForThisDevice)

        return {
          ...prev,
          quantities: {
            ...prev.quantities,
            [deviceType]: safeQty,
          },
        }
      })

      scheduleSave()
    },
    [scheduleSave],
  )

  const setSessionName = useCallback(
    (name: string) => {
      setSessionNameState(name)
      scheduleSave()
    },
    [scheduleSave],
  )

  const loadSession = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const { session } = await api.getSession(id)
      setSessionId(session.id)
      setSessionNameState(session.name)
      setConfig(session.config)
      setLastSavedAt(session.updatedAt)
      writeSessionIdToUrl(session.id)
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 404
          ? `Session not found: ${id}`
          : 'Failed to load session'
      setError(msg)
      clearSessionIdFromUrl()
    } finally {
      setIsLoading(false)
    }
  }, [])

  const newSession = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setConfig(EMPTY_CONFIG)
    setSessionId(null)
    setSessionNameState('Untitled site')
    setLastSavedAt(null)
    setError(null)
    clearSessionIdFromUrl()
  }, [])

  const clearError = useCallback(() => setError(null), [])

  // On-mount session restore

  useEffect(() => {
    const id = readSessionIdFromUrl()
    if (id) {
      void loadSession(id)
    }
  }, [loadSession])

  // Cleanup

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  return {
    config,
    layout,
    summary,
    sessionId,
    sessionName,
    isSaving,
    isLoading,
    lastSavedAt,
    error,
    setQuantity,
    setSessionName,
    loadSession,
    newSession,
    clearError,
  }
}
