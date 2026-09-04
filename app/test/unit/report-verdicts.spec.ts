// report-verdicts.spec.ts: ported unmodified from creva_finance/frontend/test/lib.
import { contentVerdict, headlineVerdict, signatureVerdict } from '../../lib/report-verdicts'
import type { CertificateVerification } from '../../lib/api'

function verification(over: Partial<CertificateVerification> = {}): CertificateVerification {
  return {
    content: 'intact',
    expected_digest: 'a'.repeat(64),
    found_digest: 'a'.repeat(64),
    folio: 'AAAAAAAA-BBBBBBBB-CCCCCCCC-DDDDDDDD',
    signature: 'valid',
    signature_detail: 'Firmado por la llave 0123456789abcdef.',
    ...over,
  }
}

describe('headlineVerdict', () => {
  it('calls an intact, signed report authentic', () => {
    expect(headlineVerdict(verification())).toEqual({ label: 'Reporte auténtico', tone: 'good' })
  })

  it('reports altered content even when the signature checks out', () => {
    const headline = headlineVerdict(verification({ content: 'altered', signature: 'valid' }))
    expect(headline).toEqual({ label: 'Este reporte fue alterado', tone: 'bad' })
  })

  it.each(['invalid', 'missing'] as const)('treats a %s signature as unprovable origin', verdict => {
    expect(headlineVerdict(verification({ signature: verdict })).tone).toBe('bad')
  })

  it.each(['unsigned', 'no_key'] as const)('warns rather than accuses on %s', verdict => {
    expect(headlineVerdict(verification({ signature: verdict })).tone).toBe('warning')
  })
})

describe('verdict lines', () => {
  it('labels both content verdicts in Spanish', () => {
    expect(contentVerdict('intact').tone).toBe('good')
    expect(contentVerdict('altered').tone).toBe('bad')
    expect(contentVerdict('altered').label).toMatch(/no coincide/)
  })

  it('stops a valid signature from reading as reassurance over altered content', () => {
    expect(signatureVerdict('valid', 'altered')).toEqual({
      label: 'La firma cubre el sello, no el reporte que te entregaron',
      tone: 'warning',
    })
    expect(signatureVerdict('valid', 'intact').tone).toBe('good')
  })

  it('labels every signature verdict the backend can return', () => {
    for (const verdict of ['valid', 'invalid', 'missing', 'unsigned', 'no_key'] as const) {
      expect(signatureVerdict(verdict).label.length).toBeGreaterThan(0)
    }
  })
})
