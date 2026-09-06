// report-verdicts.ts: the es-MX labels for what POST /creva-score/verify answers.
// One source for the public page and anything else that reports a seal, so the wording of a
// forged document cannot drift between screens.
import type { CertificateVerification, ContentVerdict, SignatureVerdict } from '@/lib/api'

export type VerdictTone = 'good' | 'warning' | 'bad'

export interface VerdictLine {
  label: string
  tone: VerdictTone
}

const CONTENT: Record<ContentVerdict, VerdictLine> = {
  intact: { label: 'El contenido es idéntico al que se emitió', tone: 'good' },
  altered: { label: 'El contenido no coincide con el sello', tone: 'bad' },
}

const SIGNATURE: Record<SignatureVerdict, VerdictLine> = {
  valid: { label: 'Firmado por Creva', tone: 'good' },
  invalid: { label: 'La firma no es la de Creva', tone: 'bad' },
  missing: { label: 'Falta la firma que debería llevar', tone: 'bad' },
  unsigned: { label: 'Sin firma, y sin llave con qué exigirla', tone: 'warning' },
  no_key: { label: 'Sin llave de confianza para comprobar la firma', tone: 'warning' },
}

export function contentVerdict(verdict: ContentVerdict): VerdictLine {
  return CONTENT[verdict]
}

/**
 * A valid signature over a rewritten report is the trap this screen exists to avoid: the
 * signature covers the certificate, which a forger never has to touch. Saying "Firmado por Creva"
 * under "fue alterado" would read as reassurance.
 */
export function signatureVerdict(verdict: SignatureVerdict, content: ContentVerdict = 'intact'): VerdictLine {
  const line = SIGNATURE[verdict]
  if (content === 'altered' && line.tone === 'good') {
    return { label: 'La firma cubre el sello, no el reporte que te entregaron', tone: 'warning' }
  }
  return line
}

/**
 * The one line someone reads before anything else. Altered content settles it on its own: the
 * signature can be perfectly valid over a certificate nobody touched while the report was rewritten.
 */
export function headlineVerdict(result: CertificateVerification): VerdictLine {
  if (result.content === 'altered') {
    return { label: 'Este reporte fue alterado', tone: 'bad' }
  }

  const signature = SIGNATURE[result.signature]
  if (signature.tone === 'bad') {
    return { label: 'No se puede acreditar que lo emitió Creva', tone: 'bad' }
  }
  if (signature.tone === 'warning') {
    return { label: 'El contenido está intacto, el origen no se pudo comprobar', tone: 'warning' }
  }

  return { label: 'Reporte auténtico', tone: 'good' }
}

export const TONE_COLOR: Record<VerdictTone, string> = {
  good: 'var(--cr-success-text)',
  warning: 'var(--cr-warning-text)',
  bad: 'var(--cr-danger-text)',
}
