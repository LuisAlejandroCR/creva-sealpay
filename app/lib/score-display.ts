// score-display.ts: the es-MX labels, bands and colours for the score.
// One source for the dashboard gauge and the score screen, so the two cannot drift apart.
import type { ScoreBandKey } from './api'

/**
 * Keys are the factor names the API actually returns (`*_score`).
 * The bare aliases are kept so an older or newer payload still renders in
 * Spanish instead of falling through to the raw English name.
 */
const FACTOR_LABELS: Record<string, string> = {
  consistency_score: 'Constancia de uso',
  consistency: 'Constancia de uso',
  business_ratio_score: 'Gasto de negocio',
  business_ratio: 'Gasto de negocio',
  collateral_usage_score: 'Uso de tu garantía',
  collateral_usage: 'Uso de tu garantía',
  category_diversity_score: 'Variedad de gastos',
  category_diversity: 'Variedad de gastos',
}

/** One line telling the user what the factor actually measures. */
const FACTOR_HINTS: Record<string, string> = {
  consistency_score: 'Qué tan seguido registras movimientos',
  business_ratio_score: 'Cuánto de tu gasto es del negocio',
  collateral_usage_score: 'Cuánto ocupas de lo que tienes disponible',
  category_diversity_score: 'En cuántos tipos de gasto se mueve tu negocio',
}

/**
 * What the usuaria can do about a factor. Direction only — never a threshold, a ratio or a
 * formula: those are business logic and stay in the backend (regla #1 y #14 de AGENTS.md).
 */
const FACTOR_LEVERS: Record<string, string> = {
  consistency_score: 'Registrar tus movimientos seguido, aunque sean pocos, en vez de juntarlos en unos cuantos días.',
  business_ratio_score: 'Separar lo del negocio de lo personal, y corregir la categoría de los movimientos que quedaron mal clasificados.',
  collateral_usage_score: 'Mantener tu gasto dentro de lo que tu garantía respalda, sin acercarte al tope.',
  category_diversity_score: 'Que tus gastos reflejen los distintos rubros del negocio —insumos, servicios, transporte— y no uno solo.',
}

export function factorLabel(name: string): string {
  return FACTOR_LABELS[name] ?? FACTOR_LABELS[`${name}_score`] ?? name
}

export function factorHint(name: string): string {
  return FACTOR_HINTS[name] ?? FACTOR_HINTS[`${name}_score`] ?? ''
}

export function factorLever(name: string): string {
  return FACTOR_LEVERS[name] ?? FACTOR_LEVERS[`${name}_score`] ?? ''
}

export interface ScoreBand {
  label: string
  color: string
  /** Background for chips and soft fills. */
  bg: string
}

/** The word and the colour of each band. Which band a score falls into is the API's call. */
const BANDS: Record<ScoreBandKey, ScoreBand> = {
  excellent: { label: 'Excelente', color: 'var(--cr-success)', bg: 'var(--cr-success-bg)' },
  good: { label: 'Bueno', color: 'var(--cr-success)', bg: 'var(--cr-success-bg)' },
  fair: { label: 'Regular', color: 'var(--cr-warning-text)', bg: 'var(--cr-warning-bg)' },
  poor: { label: 'Por mejorar', color: 'var(--cr-danger-text)', bg: 'var(--cr-danger-bg)' },
}

/**
 * The band carries a WORD as well as a colour, so the score is never communicated by colour alone.
 * Returns null when the API sent no band — an older deployment, or a score that does not exist yet.
 * The client says nothing instead of inventing a cut-off, which is how the two ended up disagreeing.
 */
export function scoreBand(band: ScoreBandKey | null | undefined): ScoreBand | null {
  return band ? (BANDS[band] ?? null) : null
}

/** Semicircular gauge arc on a 160×82 viewBox, over the scale the API reported. */
export function scoreArcPath(value: number, max: number): string {
  if (max <= 0) return ''
  const clamped = Math.max(0, Math.min(max, value))
  if (clamped >= max) return 'M 8 80 A 72 72 0 0 1 152 80'
  const angle = (1 - clamped / max) * Math.PI
  const x = 80 + 72 * Math.cos(angle)
  const y = 80 - 72 * Math.sin(angle)
  return `M 8 80 A 72 72 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`
}
