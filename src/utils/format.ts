import { event } from '../config/event'

/** Resolves an image path from config against the deployment base (GitHub Pages sub-path safe). */
export function assetUrl(path: string): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

function parseEventDate(): Date {
  const [day, month, year] = event.date.split('.').map(Number)
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1)
}

const eventDate = parseEventDate()

/** "9 грудня" */
export const eventDayMonth = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(eventDate)

/** "середа" */
export const eventWeekday = new Intl.DateTimeFormat('uk-UA', { weekday: 'long' }).format(eventDate)

const dayMonthParts = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).formatToParts(eventDate)

/** "9" */
export const eventDay = dayMonthParts.find((part) => part.type === 'day')?.value ?? ''

/** "грудня" (genitive, as used with a day number) */
export const eventMonth = dayMonthParts.find((part) => part.type === 'month')?.value ?? ''

/** "2026" */
export const eventYear = String(eventDate.getFullYear())
