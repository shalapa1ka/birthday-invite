/**
 * RSVP API for the birthday invitation (Cloudflare Worker + KV).
 *
 *   GET  /rsvp?guest=<id>   → current answer of the guest (or null)
 *   POST /rsvp              → save { guestId, attending, dishId? } and notify Telegram
 *
 * One guest = one KV record, so a repeated submission updates the answer instead of duplicating it.
 * Guests and dishes are imported from the site config — there is a single source of truth.
 * The site config holds only SHA-256 hashes of guest tokens; the raw token from the request is hashed here,
 * and KV keys use the hash too, so tokens are never stored anywhere.
 */
import { dishes } from '../../src/config/dishes'
import { guests, type Guest } from '../../src/config/guests'
import { sha256Hex } from '../../src/utils/sha256'

interface Env {
  RSVP: KVNamespace
  ALLOWED_ORIGINS?: string
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_CHAT_ID?: string
  /** Optional: pause between two changes of one guest, seconds (default 30). */
  COOLDOWN_SECONDS?: string
  /** Optional: max saved answers per guest, first answer included (default 10). */
  MAX_SAVES?: string
  /** Only for local tests: overrides https://api.telegram.org */
  TELEGRAM_API_BASE?: string
}

interface StoredRSVP {
  attending: boolean
  dishId?: string
  updatedAt: number
  /** How many times the answer was saved (first answer = 1). */
  saves: number
}

const DEFAULT_COOLDOWN_SECONDS = 30
const DEFAULT_MAX_SAVES = 10
const MAX_BODY_BYTES = 1024

const guestById = new Map(guests.map((guest) => [guest.id, guest]))
const dishById = new Map(dishes.map((dish) => [dish.id, dish]))

type CorsHeaders = Record<string, string>

function json(data: unknown, status: number, headers: CorsHeaders): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  })
}

function numberVar(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return value !== undefined && value !== '' && Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

/** Raw token from the request → guest (looked up by the token's SHA-256). */
function guestByToken(token: unknown): Guest | undefined {
  if (typeof token !== 'string' || token.length === 0 || token.length > 64) return undefined
  return guestById.get(sha256Hex(token))
}

/** KV key for a guest (by hashed id, never the raw token). */
const keyFor = (guestId: string) => `rsvp:${guestId}`

const publicView = (record: StoredRSVP) => ({
  attending: record.attending,
  ...(record.dishId ? { dishId: record.dishId } : {}),
  updatedAt: record.updatedAt,
})

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const origin = request.headers.get('Origin')
    const allowed = (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
    const originOk = origin !== null && allowed.includes(origin)
    const cors: CorsHeaders = originOk ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : { Vary: 'Origin' }

    if (request.method === 'OPTIONS') {
      if (!originOk) return new Response(null, { status: 403 })
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const url = new URL(request.url)
    if (url.pathname !== '/rsvp') return json({ ok: false, error: 'not_found' }, 404, cors)
    // Blocks other websites from using the API. (Not a hard guarantee against scripts —
    // that is what guest validation, cooldown and MAX_SAVES are for.)
    if (!originOk) return json({ ok: false, error: 'forbidden_origin' }, 403, cors)

    try {
      if (request.method === 'GET') return await handleGet(url, env, cors)
      if (request.method === 'POST') return await handlePost(request, env, ctx, cors)
      return json({ ok: false, error: 'method_not_allowed' }, 405, cors)
    } catch (error) {
      console.error(error)
      return json({ ok: false, error: 'server_error' }, 500, cors)
    }
  },
} satisfies ExportedHandler<Env>

async function handleGet(url: URL, env: Env, cors: CorsHeaders): Promise<Response> {
  const guest = guestByToken(url.searchParams.get('guest'))
  if (!guest) return json({ ok: false, error: 'unknown_guest' }, 404, cors)
  const record = await env.RSVP.get<StoredRSVP>(keyFor(guest.id), 'json')
  return json({ ok: true, rsvp: record ? publicView(record) : null }, 200, cors)
}

async function handlePost(request: Request, env: Env, ctx: ExecutionContext, cors: CorsHeaders): Promise<Response> {
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) return json({ ok: false, error: 'payload_too_large' }, 413, cors)

  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400, cors)
  }
  if (typeof body !== 'object' || body === null) return json({ ok: false, error: 'invalid_body' }, 400, cors)

  const { guestId, attending, dishId } = body as Record<string, unknown>
  const guest = guestByToken(guestId)
  if (!guest) return json({ ok: false, error: 'unknown_guest' }, 400, cors)
  if (typeof attending !== 'boolean') return json({ ok: false, error: 'invalid_attending' }, 400, cors)
  if (attending && (typeof dishId !== 'string' || !dishById.has(dishId))) {
    return json({ ok: false, error: 'invalid_dish' }, 400, cors)
  }
  const nextDishId = attending ? (dishId as string) : undefined

  const key = keyFor(guest.id)
  const previous = await env.RSVP.get<StoredRSVP>(key, 'json')

  // Same answer again (e.g. double click, page reload) — nothing to store, nothing to notify.
  if (previous && previous.attending === attending && previous.dishId === nextDishId) {
    return json({ ok: true, rsvp: publicView(previous), unchanged: true }, 200, cors)
  }

  const now = Date.now()
  const cooldownMs = numberVar(env.COOLDOWN_SECONDS, DEFAULT_COOLDOWN_SECONDS) * 1000
  const maxSaves = numberVar(env.MAX_SAVES, DEFAULT_MAX_SAVES)
  if (previous) {
    const wait = previous.updatedAt + cooldownMs - now
    if (wait > 0) return json({ ok: false, error: 'too_soon', retryAfter: Math.ceil(wait / 1000) }, 429, cors)
    if (previous.saves >= maxSaves) return json({ ok: false, error: 'too_many_changes' }, 429, cors)
  }

  const next: StoredRSVP = {
    attending,
    ...(nextDishId ? { dishId: nextDishId } : {}),
    updatedAt: now,
    saves: (previous?.saves ?? 0) + 1,
  }
  await env.RSVP.put(key, JSON.stringify(next))

  ctx.waitUntil(notifyTelegram(env, guest, previous, next))
  return json({ ok: true, rsvp: publicView(next) }, 200, cors)
}

/* ---------------- Telegram ---------------- */

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function describe(record: StoredRSVP): string {
  if (!record.attending) return '❌ не прийде'
  const dish = record.dishId ? dishById.get(record.dishId)?.name : undefined
  return `✅ прийде · ${escapeHtml(dish ?? '—')}`
}

async function summary(env: Env, justSaved: { guestId: string; record: StoredRSVP }): Promise<string> {
  const records = await Promise.all(
    guests.map(async (guest) =>
      guest.id === justSaved.guestId ? justSaved.record : env.RSVP.get<StoredRSVP>(keyFor(guest.id), 'json'),
    ),
  )
  const answered = records.filter((record): record is StoredRSVP => record !== null)
  const coming = answered.filter((record) => record.attending)
  const dishCounts = dishes
    .map((dish) => ({ dish, count: coming.filter((record) => record.dishId === dish.id).length }))
    .filter(({ count }) => count > 0)
    .map(({ dish, count }) => `• ${escapeHtml(dish.name)} — ${count}`)
  const waiting = guests.filter((_, i) => records[i] === null).map((guest) => escapeHtml(guest.name))

  return [
    `<b>Разом:</b> прийдуть ${coming.length} · не прийдуть ${answered.length - coming.length} · без відповіді ${waiting.length}`,
    ...(dishCounts.length ? ['', '<b>Страви:</b>', ...dishCounts] : []),
    ...(waiting.length ? ['', `<b>Чекаємо:</b> ${waiting.join(', ')}`] : []),
  ].join('\n')
}

async function notifyTelegram(env: Env, guest: Guest, previous: StoredRSVP | null, next: StoredRSVP): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.warn('Telegram is not configured — skipping notification')
    return
  }
  try {
    const name = escapeHtml(guest.name)
    const head = previous
      ? `🔄 <b>${name}</b> змінює відповідь\nБуло: ${describe(previous)}\nСтало: ${describe(next)}`
      : `${next.attending ? '🎉' : '😔'} <b>${name}</b> — ${describe(next)}`
    const text = `${head}\n\n${await summary(env, { guestId: guest.id, record: next })}`

    const base = env.TELEGRAM_API_BASE ?? 'https://api.telegram.org'
    const response = await fetch(`${base}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    })
    if (!response.ok) console.error('Telegram error', response.status, await response.text())
  } catch (error) {
    console.error('Telegram request failed', error)
  }
}
