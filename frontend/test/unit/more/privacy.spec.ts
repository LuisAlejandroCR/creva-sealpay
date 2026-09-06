// privacy.spec.ts: PrivacyScreen ports the reference app/privacy/page.tsx — the LFPDPPP privacy
// notice. Pure legal text, no API. Source-string checks, same convention as more/calculator.spec.ts.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/more/PrivacyScreen.tsx'), 'utf-8')
const appSource = readFileSync(join(__dirname, '../../../App.tsx'), 'utf-8')

describe('PrivacyScreen structure', () => {
  it('has no API or network dependency — it is legal text only', () => {
    expect(source).not.toMatch(/lib\/api|fetch\(|useEffect|useState/)
  })

  it('carries the LFPDPPP notice sections verbatim', () => {
    expect(source).toContain('1. Responsable del tratamiento')
    expect(source).toContain('5. Derechos ARCO')
    expect(source).toContain('9. Contacto')
    expect(source).toContain('Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)')
  })

  it('keeps the key emphasised phrases as bold runs', () => {
    expect(source).toContain('Esa información de identidad nunca se almacena')
    expect(source).toContain('privacidad@finarahub.mx')
  })

  it('lists the third-party processors from the reference', () => {
    for (const name of ['Dynerox', 'Reap Global', 'Supabase (AWS)']) {
      expect(source).toContain(name)
    }
  })

  it('exposes stable testIDs and is wired into App.tsx in place of the generic stub', () => {
    expect(source).toContain('privacy-screen')
    expect(source).toContain('privacy-section')
    expect(appSource).toMatch(/import \{ PrivacyScreen \} from "\.\/features\/more\/PrivacyScreen"/)
    expect(appSource).toMatch(/activeStub === "privacy"[\s\S]*?<PrivacyScreen/)
  })
})
