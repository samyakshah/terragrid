import type { SiteConfig, Session } from '@shared/types'

/**
 * Typed API client for the TerraGrid backend.
 *
 * All requests go through `/api/*` — Vite's dev proxy and nginx in production
 * forward this to the backend on :3001. Components never construct URLs or
 * call `fetch` directly; they call these functions.
 *
 * Errors are normalised to `ApiError` so callers can handle them uniformly.
 */

const BASE = import.meta.env.PROD ? '' : '/api'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface ErrorPayload {
  error: string
  code: number
}

export interface CreatePurchaseOrderInput {
  sessionId: string | null
  config: SiteConfig
  summary: unknown
  contact: {
    companyName: string
    installationAddress: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    contactPreference: 'sms' | 'email' | 'phone'
  }
  payment?: {
    cardLast4: string
    billingZip: string
  }
  depositCents?: number
}

export interface CreatePurchaseOrderResponse {
  orderId: string
  createdAt: number
}

export function createPurchaseOrder(
  input: CreatePurchaseOrderInput,
): Promise<CreatePurchaseOrderResponse> {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!res.ok) {
    let payload: ErrorPayload = { error: res.statusText, code: res.status }
    try {
      payload = (await res.json()) as ErrorPayload
    } catch {
      // body wasn't JSON — keep the statusText fallback
    }
    throw new ApiError(res.status, payload.code ?? res.status, payload.error ?? 'Request failed')
  }

  return (await res.json()) as T
}

// Endpoints

export interface CreateSessionInput {
  name: string
  config: SiteConfig
}

export interface UpdateSessionInput {
  name?: string
  config?: SiteConfig
}

export function createSession(
  input: CreateSessionInput,
): Promise<{ sessionId: string; session: Session }> {
  return request('/sessions', { method: 'POST', body: JSON.stringify(input) })
}

export function getSession(id: string): Promise<{ session: Session }> {
  return request(`/sessions/${encodeURIComponent(id)}`)
}

export function updateSession(
  id: string,
  input: UpdateSessionInput,
): Promise<{ session: Session }> {
  return request(`/sessions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function listSessions(limit = 20): Promise<{ sessions: Session[] }> {
  return request(`/sessions?limit=${limit}`)
}

export function deleteSession(id: string): Promise<{ deleted: true }> {
  return request(`/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
