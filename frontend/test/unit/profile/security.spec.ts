// security.spec.ts: SecurityScreen ports the reference profile/security/page.tsx — three cards
// (password reset, session, your data). Source-string checks, same convention as
// profile/structure.spec.ts.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/profile/SecurityScreen.tsx'), 'utf-8')

describe('SecurityScreen structure', () => {
  it('sends the reset link via the real auth API', () => {
    expect(source).toMatch(/auth\.forgotPassword\(/)
  })

  it('reads the email from the Clerk session, not the legacy auth API', () => {
    expect(source).toMatch(/primaryEmailAddress\?\.emailAddress/)
    expect(source).not.toMatch(/auth\s*\.\s*me\s*\(\s*\)\s*\n?\s*\.then/)
  })

  it('carries all three reference cards', () => {
    for (const heading of ['Cambiar tu contraseña', 'Tu sesión', 'Tus datos']) {
      expect(source).toContain(heading)
    }
  })

  it('exposes stable testIDs for the reset action and its outcomes', () => {
    for (const id of ['security-reset-cta', 'security-reset-sent', 'security-reset-error']) {
      expect(source).toContain(id)
    }
  })
})
