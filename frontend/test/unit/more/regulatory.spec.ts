// regulatory.spec.ts: RegulatoryScreen ports the reference app/regulatory/page.tsx — the
// user-agnostic regulatory radar from crevaScore.radar(), split into publications and standing
// rules. Source-string checks, same convention as more/notifications.spec.ts.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/more/RegulatoryScreen.tsx'), 'utf-8')
const appSource = readFileSync(join(__dirname, '../../../App.tsx'), 'utf-8')

describe('RegulatoryScreen structure', () => {
  it('reads the real radar endpoint, not mock data', () => {
    expect(source).toMatch(/crevaScore\b/)
    expect(source).toMatch(/\.radar\(\)/)
    expect(source).toMatch(/radar\?\.available/)
    expect(source).toMatch(/radar\.data/)
  })

  it('splits alerts into publications and standing rules like the reference', () => {
    expect(source).toMatch(/alert\.kind === "publication"/)
    expect(source).toMatch(/alert\.kind === "standing_rule"/)
  })

  it('keeps the privacy statement and the unavailable fallback copy', () => {
    expect(source).toContain('Esta revisión no consulta ningún dato tuyo.')
    expect(source).toContain('Revisión no disponible')
  })

  it('shows each alert its official source and evidence link', () => {
    expect(source).toMatch(/EvidenceLink href=\{alert\.url\}/)
    expect(source).toContain('Diario Oficial de la Federación')
    expect(source).toContain('sources_available')
  })

  it('exposes stable testIDs for loading, unavailable and alert rows', () => {
    for (const id of ['regulatory-screen', 'regulatory-loading', 'regulatory-unavailable', 'regulatory-alert']) {
      expect(source).toContain(id)
    }
  })

  it('is wired into App.tsx in place of the generic stub', () => {
    expect(appSource).toMatch(/import \{ RegulatoryScreen \} from "\.\/features\/more\/RegulatoryScreen"/)
    expect(appSource).toMatch(/activeStub === "regulatory"[\s\S]*?<RegulatoryScreen/)
  })
})
