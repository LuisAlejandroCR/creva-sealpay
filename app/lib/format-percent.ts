// format-percent.ts: the single place that turns a ratio into es-MX percent text.
// Shares of one whole are rounded together, never one by one: half of a month rounded apart from
// the other half reads "51% · 50%", which is 101% of it.

/** What the API hands over: a ratio between 0 and 1, as a decimal string or a number. */
type ApiRatio = string | number | null | undefined

const PERCENT = new Intl.NumberFormat('es-MX', { style: 'percent', maximumFractionDigits: 0 })

function toRatio(value: ApiRatio): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** "12%" — one ratio standing on its own, where nothing else has to add up to it. */
export function formatPercent(value: ApiRatio): string {
  const ratio = toRatio(value)
  return ratio === null ? '' : PERCENT.format(ratio)
}

/** A share that `splitPercent` already resolved, as text: no screen writes the sign itself. */
export function formatShare(share: number): string {
  return `${share}%`
}

/**
 * Whole shares of one total that always add up to 100 — largest remainder, so the rounding debt
 * lands on the slice with the most to claim instead of being paid by every slice at once.
 */
export function splitPercent(values: number[]): number[] {
  const parts = values.map(value => (Number.isFinite(value) && value > 0 ? value : 0))
  const total = parts.reduce((sum, value) => sum + value, 0)
  if (total <= 0) return parts.map(() => 0)

  const exact = parts.map(value => (value / total) * 100)
  const shares = exact.map(Math.floor)
  let left = 100 - shares.reduce((sum, share) => sum + share, 0)

  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)

  for (const { index } of byRemainder) {
    if (left <= 0) break
    shares[index] += 1
    left -= 1
  }

  return shares
}
