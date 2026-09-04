// report-display.ts: how a report signal is named on screen and on paper — its category, its hint
// and its tone. The screen and the printed document read the same map, so a signal cannot be called
// one thing in the app and another in the PDF someone else receives.
import type { ReportSignal } from './api'

export const REPORT_CATEGORIES: ReportSignal['category'][] = [
  'business_verification',
  'regulatory',
  'reference_rate',
]

export const CATEGORY_TITLES: Record<ReportSignal['category'], string> = {
  business_verification: 'Sobre tu negocio',
  regulatory: 'Marco regulatorio',
  reference_rate: 'Tasas de referencia',
}

export const CATEGORY_HINTS: Record<ReportSignal['category'], string> = {
  business_verification: 'Lo único aquí que sale de una consulta sobre tu negocio.',
  regulatory: 'Reglas y novedades oficiales. Las mismas para cualquiera.',
  reference_rate: 'El precio del dinero hoy, según Banco de México.',
}

export const TONE_LABELS: Record<ReportSignal['tone'], string> = {
  positive: 'Encontrado',
  neutral: 'Informativo',
  unavailable: 'No disponible',
}

/** Screen only: on paper the tone travels in the chip's fill, which the printer is told to keep. */
export const TONE_COLORS: Record<ReportSignal['tone'], string> = {
  positive: 'var(--cr-success-text)',
  neutral: 'var(--cr-text-muted)',
  unavailable: 'var(--cr-warning-text)',
}
