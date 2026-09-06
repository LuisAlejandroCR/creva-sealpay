// walletCore.spec.ts: the demo/privy mode wiring — mode availability, demo delegation, and the
// privy policy gate running before any header is produced.
import type { PaymentRequirements } from '../../../features/query/gatewayClient'
import { SpendingPolicyError } from '../../../features/wallet/spendingPolicy'
import {
  createPaymentWallet,
  resolveAvailableModes,
  WalletNotConfiguredError,
} from '../../../features/wallet/walletCore'

const requirements: PaymentRequirements = {
  scheme: 'exact',
  network: 'hedera:testnet',
  maxAmountRequired: '250',
  resource: '/creva-score/report',
  description: 'Creva signal report',
  mimeType: 'application/json',
  payTo: '0.0.7162784',
  maxTimeoutSeconds: 60,
  asset: '0.0.0',
}

const demoCreds = { accountId: '0.0.1001', privateKey: 'demo-key' }

describe('resolveAvailableModes', () => {
  it('is exactly [demo] unless privy is configured, has a policy, and the signer loaded', () => {
    expect(resolveAvailableModes({ privyConfigured: false, policyConfigured: false, privySignerAvailable: false })).toEqual(['demo'])
    expect(resolveAvailableModes({ privyConfigured: true, policyConfigured: false, privySignerAvailable: true })).toEqual(['demo'])
    expect(resolveAvailableModes({ privyConfigured: true, policyConfigured: true, privySignerAvailable: false })).toEqual(['demo'])
    expect(resolveAvailableModes({ privyConfigured: true, policyConfigured: true, privySignerAvailable: true })).toEqual(['demo', 'privy'])
  })
})

describe('createPaymentWallet — demo mode', () => {
  it('delegates to the injected demo signer verbatim', async () => {
    const buildSignedPaymentHeader = jest.fn().mockResolvedValue('HEADER123')
    const wallet = createPaymentWallet({
      mode: 'demo',
      availableModes: ['demo'],
      demo: { readDemoCredentials: () => demoCreds, buildSignedPaymentHeader },
    })
    await expect(wallet.signPayment(requirements)).resolves.toBe('HEADER123')
    expect(buildSignedPaymentHeader).toHaveBeenCalledWith(requirements, demoCreds)
    expect(wallet.address).toBe('0.0.1001')
  })

  it('throws WalletNotConfiguredError when no demo credentials exist', async () => {
    const wallet = createPaymentWallet({
      mode: 'demo',
      availableModes: ['demo'],
      demo: { readDemoCredentials: () => undefined, buildSignedPaymentHeader: jest.fn() },
    })
    await expect(wallet.signPayment(requirements)).rejects.toBeInstanceOf(WalletNotConfiguredError)
  })
})

describe('createPaymentWallet — privy mode', () => {
  const demo = { readDemoCredentials: () => demoCreds, buildSignedPaymentHeader: jest.fn() }

  it('runs the spending policy before calling the privy signer', async () => {
    const privySignPayment = jest.fn().mockResolvedValue('PRIVY_HEADER')
    const wallet = createPaymentWallet({
      mode: 'privy',
      availableModes: ['demo', 'privy'],
      demo,
      privy: {
        address: '0xabc',
        policy: { monthlyCapTinybar: 1000n, perPaymentCapTinybar: 300n },
        ledger: [],
        now: () => Date.UTC(2026, 8, 15),
        privySignPayment,
      },
    })
    await expect(wallet.signPayment(requirements)).resolves.toBe('PRIVY_HEADER')
    expect(privySignPayment).toHaveBeenCalledTimes(1)
  })

  it('never calls the privy signer when the amount breaks the policy', async () => {
    const privySignPayment = jest.fn()
    const wallet = createPaymentWallet({
      mode: 'privy',
      availableModes: ['demo', 'privy'],
      demo,
      privy: {
        address: '0xabc',
        policy: { monthlyCapTinybar: 1000n, perPaymentCapTinybar: 100n },
        ledger: [],
        now: () => Date.UTC(2026, 8, 15),
        privySignPayment,
      },
    })
    await expect(wallet.signPayment(requirements)).rejects.toBeInstanceOf(SpendingPolicyError)
    expect(privySignPayment).not.toHaveBeenCalled()
  })

  it('falls back to demo when privy mode is requested but not available', () => {
    const wallet = createPaymentWallet({ mode: 'privy', availableModes: ['demo'], demo })
    expect(wallet.mode).toBe('demo')
  })
})
