// fiscal-info.spec.ts: FiscalInfoScreen ports the reference profile/fiscal/page.tsx — RFC, razón
// social, régimen, estado, código postal y dirección vía profiles.getFiscal()/updateFiscal().
// Source-string checks, same convention as profile/structure.spec.ts.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/profile/FiscalInfoScreen.tsx'), 'utf-8')

describe('FiscalInfoScreen structure', () => {
  it('loads and saves via the real fiscal profile API, not mock data', () => {
    expect(source).toMatch(/profiles\.getFiscal\(\)/)
    expect(source).toMatch(/profiles\.updateFiscal\(/)
  })

  it('reuses the ported INEGI state catalogue instead of a new one', () => {
    expect(source).toMatch(/from\s*"\.\.\/\.\.\/lib\/mx-states"/)
  })

  it('carries the not-tax-advice disclosure from the reference screen', () => {
    expect(source).toMatch(/no otorga asesoría fiscal/)
  })

  it('exposes the fields and save action with stable testIDs', () => {
    for (const id of [
      'fiscal-person-type',
      'fiscal-rfc',
      'fiscal-business-name',
      'fiscal-tax-regime',
      'fiscal-state',
      'fiscal-postal-code',
      'fiscal-address',
      'fiscal-info-save-cta',
    ]) {
      expect(source).toContain(id)
    }
  })
})
