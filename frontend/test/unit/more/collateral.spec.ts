// collateral.spec.ts: CollateralScreen ports the reference app/collateral/page.tsx — the SPEI
// deposit CLABE and spending capacity from collateral.get(). Source-string checks, same convention
// as more/report.spec.ts.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/more/CollateralScreen.tsx'), 'utf-8')
const appSource = readFileSync(join(__dirname, '../../../App.tsx'), 'utf-8')

describe('CollateralScreen structure', () => {
  it('reads the real collateral endpoint, not mock data', () => {
    expect(source).toMatch(/collateral\.get\(\)/)
    expect(source).toMatch(/setErrorMsg\(/)
  })

  it('keeps the reference status map and CLABE grouping', () => {
    expect(source).toContain('Pendiente de autorización')
    expect(source).toMatch(/\$1 \$2 \$3 \$4 \$5/)
    expect(source).toContain('Transferencia SPEI')
  })

  it('hands over the CLABE via the native Share sheet, not navigator.clipboard', () => {
    expect(source).toMatch(/Share\.share\(\{ message: data\.deposit_account \}\)/)
    expect(source).not.toMatch(/navigator\.clipboard/)
  })

  it('opens the authorization url when there is no deposit account yet', () => {
    expect(source).toMatch(/Linking\.openURL\(data\.authorization_url\)/)
    expect(source).toContain('Activa tu cuenta de depósito')
  })

  it('exposes stable testIDs for loading, error, clabe and empty states', () => {
    for (const id of ['collateral-screen', 'collateral-loading', 'collateral-error', 'collateral-clabe', 'collateral-empty']) {
      expect(source).toContain(id)
    }
  })

  it('is wired into App.tsx in place of the generic stub', () => {
    expect(appSource).toMatch(/import \{ CollateralScreen \} from "\.\/features\/more\/CollateralScreen"/)
    expect(appSource).toMatch(/activeStub === "collateral"[\s\S]*?<CollateralScreen/)
  })
})
