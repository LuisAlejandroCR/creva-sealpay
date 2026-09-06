// privyChain.ts: the viem Chain definition for Hedera Testnet (EVM chain id 296), which Privy
// needs because it ships no Hedera preset (brainstorming.md §10.5). Passed to Privy's
// `supportedChains` and to onchainRead.ts's public client. RPC URL comes from
// EXPO_PUBLIC_HEDERA_JSON_RPC_URL and defaults to the public Hashio testnet relay.
import { defineChain } from 'viem'

export const HEDERA_TESTNET_CHAIN_ID = 296

export const DEFAULT_HEDERA_TESTNET_RPC_URL = 'https://testnet.hashio.io/api'

export function hederaTestnetRpcUrl(): string {
  return process.env.EXPO_PUBLIC_HEDERA_JSON_RPC_URL || DEFAULT_HEDERA_TESTNET_RPC_URL
}

/**
 * hederaTestnet: viem `defineChain` for chain 296. `nativeCurrency.decimals` is 18 because the
 * JSON-RPC Relay reports HBAR balances in weibar (10^-18 HBAR) even though the native ledger unit
 * is tinybar (10^-8 HBAR) — the EVM tooling contract, not a mistake.
 */
export const hederaTestnet = defineChain({
  id: HEDERA_TESTNET_CHAIN_ID,
  name: 'Hedera Testnet',
  nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
  rpcUrls: {
    default: { http: [hederaTestnetRpcUrl()] },
  },
  blockExplorers: {
    default: { name: 'HashScan', url: 'https://hashscan.io/testnet' },
  },
  testnet: true,
})
