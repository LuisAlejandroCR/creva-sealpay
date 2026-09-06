// auth-parity.spec.ts: the Creva-authored chrome copy of SignInScreen must match the reference
// auth shell (AuthHeader / AuthFooter), even though the form itself is hand-built because Clerk's
// hosted <SignIn> widget has no Expo build. Source-string checks.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/auth/SignInScreen.tsx'), 'utf-8')

describe('SignInScreen auth-shell parity', () => {
  it('uses the reference AuthHeader titles and subtitles per mode', () => {
    expect(source).toContain('"Iniciar sesión"')
    expect(source).toContain('"Crear cuenta"')
    expect(source).toContain('Tu plataforma financiera')
    expect(source).toContain('Empieza a tomar el control')
  })

  it('uses the reference AuthFooter cross-link wording', () => {
    expect(source).toContain('¿No tienes cuenta? ')
    expect(source).toContain('¿Ya tienes cuenta? ')
    expect(source).not.toMatch(/"Regístrate"|"Entra"/)
  })

  it('keeps the AuthDivider label from the reference', () => {
    expect(source).toContain('o con correo')
  })

  it('does not embed Google\'s colour wordmark — third-party media is out of scope', () => {
    expect(source).not.toMatch(/#4285F4|#34A853|#FBBC05|#EA4335/)
  })
})
