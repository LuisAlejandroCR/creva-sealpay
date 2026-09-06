// PrivyWalletProvider.tsx: root provider for the additive payment-wallet layer. Mounted once in
// App.tsx. It exposes usePaymentWallet() to QueryScreen/VerifyScreen. Default mode is always
// 'demo', which delegates to app/features/query/hederaPayment.ts unchanged. 'privy' mode is only
// selectable when Privy is configured (app id + spending policy) and the SDK is installed; until
// then usePaymentWallet() behaves exactly as the demo-only flow did.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { buildSignedPaymentHeader, readDemoCredentialsFromEnv } from '../query/hederaPayment'
import { readPrivyConfigFromEnv } from './privyConfig'
import { isPrivySdkAvailable, makePrivySigner } from './privyEmbeddedWallet'
import { readSpendingPolicyFromEnv, type SpendingLedgerEntry } from './spendingPolicy'
import {
  createPaymentWallet,
  resolveAvailableModes,
  type PaymentWallet,
  type PaymentWalletMode,
} from './walletCore'

export interface PaymentWalletContextValue {
  wallet: PaymentWallet
  mode: PaymentWalletMode
  availableModes: PaymentWalletMode[]
  setMode: (mode: PaymentWalletMode) => void
  /** Log a settled payment so the monthly spending-cap check stays accurate this session. */
  recordPayment: (amountTinybar: bigint) => void
}

const PaymentWalletContext = createContext<PaymentWalletContextValue | null>(null)

const demoDeps = {
  readDemoCredentials: readDemoCredentialsFromEnv,
  buildSignedPaymentHeader,
}

export function PrivyWalletProvider({ children }: { children: ReactNode }) {
  const privyConfig = readPrivyConfigFromEnv()
  const policy = readSpendingPolicyFromEnv()
  const privySignerAvailable = privyConfig !== null && policy !== null && isPrivySdkAvailable()

  const availableModes = useMemo(
    () =>
      resolveAvailableModes({
        privyConfigured: privyConfig !== null,
        policyConfigured: policy !== null,
        privySignerAvailable,
      }),
    [privyConfig, policy, privySignerAvailable],
  )

  const [mode, setModeRaw] = useState<PaymentWalletMode>('demo')
  const [ledger, setLedger] = useState<SpendingLedgerEntry[]>([])

  const setMode = useCallback(
    (next: PaymentWalletMode) => setModeRaw(availableModes.includes(next) ? next : 'demo'),
    [availableModes],
  )

  const recordPayment = useCallback(
    (amountTinybar: bigint) => setLedger((prev) => [...prev, { atMs: Date.now(), amountTinybar }]),
    [],
  )

  const wallet = useMemo<PaymentWallet>(() => {
    const privySigner = policy && privySignerAvailable ? makePrivySigner(undefined) : null
    return createPaymentWallet({
      mode,
      availableModes,
      demo: demoDeps,
      privy:
        policy && privySigner
          ? {
              address: privySigner.address,
              policy,
              ledger,
              now: () => Date.now(),
              privySignPayment: privySigner.signPayment,
            }
          : undefined,
    })
  }, [mode, availableModes, policy, privySignerAvailable, ledger])

  const value = useMemo<PaymentWalletContextValue>(
    () => ({ wallet, mode: wallet.mode, availableModes, setMode, recordPayment }),
    [wallet, availableModes, setMode, recordPayment],
  )

  return <PaymentWalletContext.Provider value={value}>{children}</PaymentWalletContext.Provider>
}

/**
 * usePaymentWallet: safe to call with no provider mounted — it falls back to the demo-only wallet,
 * so a screen rendered in isolation (or a test) keeps working exactly as before.
 */
export function usePaymentWallet(): PaymentWalletContextValue {
  const ctx = useContext(PaymentWalletContext)
  if (ctx) return ctx
  const wallet = createPaymentWallet({ mode: 'demo', availableModes: ['demo'], demo: demoDeps })
  return {
    wallet,
    mode: 'demo',
    availableModes: ['demo'],
    setMode: () => undefined,
    recordPayment: () => undefined,
  }
}
