// structure.spec.ts: ProfileScreen ports the reference profile/page.tsx's menu (details, fiscal,
// security, notifications, help) and sign-out flow, consuming Clerk's already-configured context
// via useUser/useClerk rather than a new provider (ClerkAppProvider.tsx is out of scope here).
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/profile/ProfileScreen.tsx'), 'utf-8')

describe('ProfileScreen structure', () => {
  it('consumes Clerk via useUser/useClerk instead of mounting a new provider', () => {
    expect(source).toMatch(/import\s*\{\s*useClerk,\s*useUser\s*\}\s*from\s*"@clerk\/clerk-expo"/)
    expect(source).not.toMatch(/ClerkProvider/)
  })

  it('lists the five reference menu rows', () => {
    for (const label of ['Datos personales', 'Información fiscal', 'Seguridad', 'Avisos', 'Ayuda']) {
      expect(source).toContain(label)
    }
  })

  it('calls signOut on logout', () => {
    expect(source).toMatch(/signOut\(\)/)
    expect(source).toMatch(/testID="profile-logout"/)
  })

  it('offers the delete-account entry point, matching the reference screen', () => {
    expect(source).toMatch(/Eliminar mi cuenta/)
  })
})
