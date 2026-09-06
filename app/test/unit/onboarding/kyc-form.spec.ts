// kyc-form.spec.ts: KycFormScreen ports creva_finance/frontend/app/kyc/page.tsx as onboarding
// step 2 (after World Selfie Check, which is left untouched). Checks the CURP/phone helpers behave
// like the reference and that the screen wires kyc.apply + kyc.status + WebBrowser hand-off.
import { readFileSync } from 'fs'
import { join } from 'path'
import { isValidCurp, formatMxPhone } from '../../../features/onboarding/kyc-format'

const screen = readFileSync(join(__dirname, '../../../features/onboarding/KycFormScreen.tsx'), 'utf-8')
const app = readFileSync(join(__dirname, '../../../App.tsx'), 'utf-8')

describe('kyc-format helpers (ported from kyc/page.tsx:80, :90-93)', () => {
  it('accepts a well-formed CURP and rejects malformed ones', () => {
    expect(isValidCurp('GOMC960912HDFabc09')).toBe(false) // lowercase block
    expect(isValidCurp('GOMC960912HDFRDR09')).toBe(true)
    expect(isValidCurp('GOMC960912HDFRDR0')).toBe(false) // 17 chars
    expect(isValidCurp('')).toBe(false)
  })

  it('normalises Mexican phone numbers to +52 international form', () => {
    expect(formatMxPhone('55 1234 5678')).toBe('+525512345678')
    expect(formatMxPhone('52 55 1234 5678')).toBe('+525512345678')
    expect(formatMxPhone('+52 (55) 1234-5678')).toBe('+525512345678')
    expect(formatMxPhone('')).toBe('')
  })
})

describe('KycFormScreen structure', () => {
  it('collects the reference fields and validates CURP before submit', () => {
    for (const id of ['kyc-first-name', 'kyc-last-name', 'kyc-curp', 'kyc-email', 'kyc-phone']) {
      expect(screen).toContain(id)
    }
    expect(screen).toMatch(/isValidCurp\(curp\)/)
    expect(screen).toContain('El CURP no tiene un formato válido')
  })

  it('hands off through the real endpoint and the native browser, then polls status', () => {
    expect(screen).toMatch(/kyc\.apply\(\{/)
    expect(screen).toMatch(/kyc\s*\n?\s*\.status\(\)/)
    expect(screen).toMatch(/WebBrowser\.openBrowserAsync\(/)
  })

  it('keeps the reference state copy for pending / verified / unavailable', () => {
    expect(screen).toContain('Verificación en proceso')
    expect(screen).toContain('¡Verificación exitosa!')
    expect(screen).toContain('En cambio de proveedor')
  })

  it('is onboarding step 2 in App.tsx, after Selfie Check, not replacing it', () => {
    expect(app).toMatch(/onVerified=\{\(\) => setStep\("kyc"\)\}/)
    expect(app).toMatch(/step === "kyc"[\s\S]*?<KycFormScreen/)
    expect(app).toMatch(/<SelfieCheckScreen/) // still there
  })
})
