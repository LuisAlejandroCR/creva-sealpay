// business-verification.spec.ts: BusinessVerificationScreen ports the reference
// app/business-verification/page.tsx — the official-directory badge from crevaScore.verify(),
// searched on open from the fiscal profile. Source-string checks, like more/collateral.spec.ts.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/more/BusinessVerificationScreen.tsx'), 'utf-8')
const appSource = readFileSync(join(__dirname, '../../../App.tsx'), 'utf-8')

describe('BusinessVerificationScreen structure', () => {
  it('verifies against the real endpoint, seeded from the fiscal profile', () => {
    expect(source).toMatch(/crevaScore\b/)
    expect(source).toMatch(/\.verify\(\{/)
    expect(source).toMatch(/\.getFiscal\(\)/)
  })

  it('searches on open only when name and state are already known, else shows fields', () => {
    expect(source).toMatch(/name\.trim\(\)\.length > 1 && code !== ""/)
    expect(source).toMatch(/else setAskingAgain\(true\)/)
  })

  it('keeps the "does not move the score" statement and every status copy', () => {
    expect(source).toContain('Tu puntaje no depende de esto.')
    expect(source).toContain('Tu negocio aparece en el directorio oficial')
    expect(source).toContain('Tu negocio no está en el directorio')
    expect(source).toContain('Encontramos varios negocios con nombre parecido')
  })

  it('shows the badge provenance rows when a badge comes back', () => {
    expect(source).toContain('Directorio oficial (SIEM)')
    expect(source).toMatch(/confirmed_by_rfc \? "Sí" : "No, solo por nombre"/)
  })

  it('exposes stable testIDs for loading, fields, search and result', () => {
    for (const id of ['business-verification-screen', 'bv-loading', 'bv-fields', 'bv-search-cta', 'bv-error', 'bv-result']) {
      expect(source).toContain(id)
    }
  })

  it('is wired into App.tsx in place of the generic stub', () => {
    expect(appSource).toMatch(/import \{ BusinessVerificationScreen \} from "\.\/features\/more\/BusinessVerificationScreen"/)
    expect(appSource).toMatch(/activeStub === "business-verification"[\s\S]*?<BusinessVerificationScreen/)
  })
})
