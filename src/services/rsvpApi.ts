export interface RSVPSubmission {
  guestId: string
  attending: boolean
  dishId?: string
}

/** Answer as stored on the server. */
export interface SavedRSVP {
  attending: boolean
  dishId?: string
  updatedAt: number
}

export type RSVPErrorCode = 'network' | 'too_soon' | 'too_many_changes' | 'unknown'

export class RSVPError extends Error {
  readonly code: RSVPErrorCode
  readonly retryAfter: number | undefined

  constructor(code: RSVPErrorCode, message: string, retryAfter?: number) {
    super(message)
    this.code = code
    this.retryAfter = retryAfter
  }
}

const API_BASE = import.meta.env.VITE_RSVP_API?.replace(/\/+$/, '')
const TIMEOUT_MS = 15_000

/* ---------------- response parsing ---------------- */

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

function isSavedRSVP(value: unknown): value is SavedRSVP {
  return (
    isRecord(value) &&
    typeof value.attending === 'boolean' &&
    typeof value.updatedAt === 'number' &&
    (value.dishId === undefined || typeof value.dishId === 'string')
  )
}

async function request(path: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    let response: Response
    try {
      response = await fetch(`${API_BASE}${path}`, { ...init, signal: controller.signal })
    } catch (error) {
      throw new RSVPError('network', `Network error: ${String(error)}`)
    }

    const data: unknown = await response.json().catch(() => null)
    if (!isRecord(data)) throw new RSVPError('unknown', `Unexpected response (HTTP ${response.status})`)

    if (!response.ok || data.ok !== true) {
      const error = typeof data.error === 'string' ? data.error : 'unknown'
      if (error === 'too_soon') {
        const retryAfter = typeof data.retryAfter === 'number' ? data.retryAfter : undefined
        throw new RSVPError('too_soon', 'Cooldown', retryAfter)
      }
      if (error === 'too_many_changes') throw new RSVPError('too_many_changes', 'Too many changes')
      throw new RSVPError('unknown', `API error: ${error} (HTTP ${response.status})`)
    }
    return data
  } finally {
    clearTimeout(timer)
  }
}

/* ---------------- dev mock (no API configured) ---------------- */

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const mockKey = (guestId: string) => `rsvp-mock:${guestId}`

function mockRead(guestId: string): SavedRSVP | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(mockKey(guestId)) ?? 'null')
    return isSavedRSVP(value) ? value : null
  } catch {
    return null
  }
}

/* ---------------- public API ---------------- */

/** Current answer of the guest, or null if they have not answered yet. */
export async function fetchRSVP(guestId: string): Promise<SavedRSVP | null> {
  if (!API_BASE) {
    if (!import.meta.env.DEV) throw new RSVPError('unknown', 'VITE_RSVP_API is not configured')
    await wait(300)
    return mockRead(guestId)
  }
  const data = await request(`/rsvp?guest=${encodeURIComponent(guestId)}`)
  if (data.rsvp === null) return null
  if (!isSavedRSVP(data.rsvp)) throw new RSVPError('unknown', 'Malformed RSVP in response')
  return data.rsvp
}

/** Saves (creates or updates) the guest's answer. Returns the stored answer. */
export async function sendRSVP(submission: RSVPSubmission): Promise<SavedRSVP> {
  if (!API_BASE) {
    if (!import.meta.env.DEV) throw new RSVPError('unknown', 'VITE_RSVP_API is not configured')
    console.info('[rsvp] VITE_RSVP_API is not set — saving to localStorage (dev mock)', submission)
    await wait(700)
    const saved: SavedRSVP = {
      attending: submission.attending,
      ...(submission.dishId ? { dishId: submission.dishId } : {}),
      updatedAt: Date.now(),
    }
    try {
      localStorage.setItem(mockKey(submission.guestId), JSON.stringify(saved))
    } catch {
      // storage unavailable — ignore
    }
    return saved
  }
  const data = await request('/rsvp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission),
  })
  if (!isSavedRSVP(data.rsvp)) throw new RSVPError('unknown', 'Malformed RSVP in response')
  return data.rsvp
}
