// format-money.ts: the single place that turns an API amount into es-MX text.
// Two forms because precision is a claim: what was counted keeps its cents, what was derived rounds
// to whole pesos. A missing amount is written empty — `$0` asserts a zero nobody ever counted.

/** What the API hands over: a decimal string, a number, or nothing at all. */
type ApiAmount = string | number | null | undefined

/** The tone a figure carries when it can land on either side of zero. */
export type AmountTone = 'success' | 'danger' | 'default'

// narrowSymbol pins the "$": some ICU builds write "MX$" for es-MX, and the dashboard was already
// stripping that prefix out of the formatted string by hand.
const BASE: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'MXN',
  currencyDisplay: 'narrowSymbol',
}

const EXACT = new Intl.NumberFormat('es-MX', { ...BASE, minimumFractionDigits: 2, maximumFractionDigits: 2 })
const ROUNDED = new Intl.NumberFormat('es-MX', { ...BASE, maximumFractionDigits: 0 })

/** The number behind the value, or null when there is none: empty, absent, or not a number. */
export function toAmount(value: ApiAmount): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** "$1,234.56" — for what was counted: a balance, a movement, a statement entry, a card limit. */
export function formatMoney(value: ApiAmount): string {
  const amount = toAmount(value)
  return amount === null ? '' : EXACT.format(amount)
}

/** "$1,235" — for what was derived: a projection, a suggested amount, a slice of a chart. */
export function formatMoneyRounded(value: ApiAmount): string {
  const amount = toAmount(value)
  return amount === null ? '' : ROUNDED.format(amount)
}

/** A loss is never painted as a gain: the three screens showing the same profit disagreed on this. */
export function amountTone(value: ApiAmount): AmountTone {
  const amount = toAmount(value)
  if (amount === null) return 'default'
  return amount < 0 ? 'danger' : 'success'
}
