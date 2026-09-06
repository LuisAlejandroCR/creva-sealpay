// format-date.ts: the single place that turns an API date into es-MX text.
// A date-only value is built from its parts: `new Date('2026-08-21')` is midnight UTC, which in
// Mexico is the day before — that is how a movement of today ended up grouped under "Ayer".

/** What the API hands over: an instant, a calendar day, a month key, or nothing at all. */
type ApiDate = string | null | undefined

const DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
const DAY_YEAR: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
const LONG_DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
const MONTH: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }

// 24 h on purpose: the a. m. / p. m. separator changes between ICU versions, so no test can pin it.
const TIME: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false }

/** True when the stored value carries a time of day. Card movements do; statement entries do not. */
export function hasTime(value: string): boolean {
  return value.length > 10
}

/** The moment as the usuaria lived it — a value without an hour keeps its own day, in local time. */
export function toLocalDate(value: string): Date {
  if (hasTime(value)) return new Date(value)
  // A month key ('2026-08') is a valid input: it lands on the first of that month.
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day || 1)
}

/** Nothing is written as nothing: the screen decides whether that reads as "—" or as silence. */
function format(value: ApiDate, options: Intl.DateTimeFormatOptions): string {
  if (!value) return ''
  const date = toLocalDate(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-MX', options)
}

/** "21 ago" — for a list already grouped by period, where the year is noise. */
export function formatDay(value: ApiDate): string {
  return format(value, DAY)
}

/** "21 ago 2026" — for a movement or a file that can be older than this year. */
export function formatDayWithYear(value: ApiDate): string {
  return format(value, DAY_YEAR)
}

/** "21 de agosto de 2026" — for the dates a third party reads: report, seal, official rule. */
export function formatLongDay(value: ApiDate): string {
  return format(value, LONG_DAY)
}

/** "Agosto de 2026" — capitalised because it stands alone as a label, never inside a sentence. */
export function formatMonth(value: ApiDate): string {
  const label = format(value, MONTH)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** The hour, or null when the stored value has none: writing 00:00 there would invent it. */
export function formatTime(value: string): string | null {
  if (!hasTime(value)) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString('es-MX', TIME)
}

/** Day and hour, with whatever the value holds. `withDay: false` for a list already grouped by day. */
export function formatMoment(value: string, options: { withDay?: boolean } = {}): string {
  const day = options.withDay === false ? null : formatDay(value)
  const time = formatTime(value)
  if (day && time) return `${day}, ${time}`
  return day ?? time ?? ''
}
