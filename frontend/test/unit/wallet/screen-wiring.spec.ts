// screen-wiring.spec.ts: the payment screens go through usePaymentWallet() (not a direct
// hederaPayment import), the selector is mounted at the pay point, and the provider is at the root.
import { readFileSync } from 'fs'
import { join } from 'path'

const read = (p: string) => readFileSync(join(__dirname, '../../..', p), 'utf8')

const query = read('features/query/QueryScreen.tsx')
const verify = read('features/verify/VerifyScreen.tsx')
const app = read('App.tsx')
const selector = read('features/wallet/WalletModeSelector.tsx')
const hedera = read('features/query/hederaPayment.ts')

describe('payment screens use the wallet layer', () => {
  it('QueryScreen signs through usePaymentWallet and shows the selector', () => {
    expect(query).toContain('usePaymentWallet()')
    expect(query).toContain('wallet.signPayment(')
    expect(query).toContain('<WalletModeSelector')
    expect(query).not.toContain('buildSignedPaymentHeader(')
  })

  it('VerifyScreen signs through usePaymentWallet and shows the selector', () => {
    expect(verify).toContain('usePaymentWallet()')
    expect(verify).toContain('wallet.signPayment(')
    expect(verify).toContain('<WalletModeSelector')
    expect(verify).not.toContain('buildSignedPaymentHeader(')
  })

  it('App.tsx mounts PrivyWalletProvider at the root', () => {
    expect(app).toContain('<PrivyWalletProvider>')
  })

  it('the selector renders nothing unless more than one mode is available (default demo)', () => {
    expect(selector).toContain('if (availableModes.length <= 1) return null')
  })

  it('the frozen demo signer has no Privy awareness', () => {
    expect(hedera.toLowerCase()).not.toContain('privy')
    expect(hedera).toContain('export async function buildSignedPaymentHeader')
  })
})
