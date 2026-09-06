// personal-data.spec.ts: PersonalDataScreen ports the reference profile/details/page.tsx —
// firstName/lastName/phone editable via profiles.get()/update() (app/lib/api.ts), email read-only
// from Clerk. Source-string checks, same convention as profile/structure.spec.ts.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/profile/PersonalDataScreen.tsx'), 'utf-8')

describe('PersonalDataScreen structure', () => {
  it('loads and saves via the real profiles API, not mock data', () => {
    expect(source).toMatch(/profiles\.get\(\)/)
    expect(source).toMatch(/profiles\.update\(/)
  })

  it('keeps the email read-only from the Clerk session', () => {
    expect(source).toMatch(/primaryEmailAddress\?\.emailAddress/)
    expect(source).toMatch(/editable=\{false\}/)
  })

  it('exposes the fields and save action with stable testIDs', () => {
    for (const id of [
      'personal-data-first-name',
      'personal-data-last-name',
      'personal-data-email',
      'personal-data-phone',
      'personal-data-save-cta',
    ]) {
      expect(source).toContain(id)
    }
  })
})
