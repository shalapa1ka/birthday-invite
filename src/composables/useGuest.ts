import { guests, type Guest } from '../config/guests'
import { sha256Hex } from '../utils/sha256'

/** A guest recognised by the token from their personal link. */
export interface ResolvedGuest extends Guest {
  /** The raw token from ?guest= — sent to the RSVP API, never stored in the bundle. */
  token: string
}

export function findGuest(token: string | null | undefined): ResolvedGuest | null {
  const value = token?.trim()
  if (!value || value.length > 64) return null
  const id = sha256Hex(value)
  const guest = guests.find((item) => item.id === id)
  return guest ? { ...guest, token: value } : null
}

/** Reads ?guest=<token> once; the page never changes the URL, so no reactivity is needed. */
export function useGuest(): { guest: ResolvedGuest | null } {
  const token = new URLSearchParams(window.location.search).get('guest')
  return { guest: findGuest(token) }
}
