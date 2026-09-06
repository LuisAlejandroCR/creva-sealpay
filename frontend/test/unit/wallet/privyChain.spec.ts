// privyChain.spec.ts: the viem defineChain(296) config is shaped the way Privy's supportedChains
// and the JSON-RPC public client need. No network here — the live read lives in the smoke script
// and the opt-in relay test.
import { hederaTestnet, HEDERA_TESTNET_CHAIN_ID } from '../../../features/wallet/privyChain'

describe('hederaTestnet (defineChain 296)', () => {
  it('carries chain id 296, HBAR native currency and a usable http rpc url', () => {
    expect(HEDERA_TESTNET_CHAIN_ID).toBe(296)
    expect(hederaTestnet.id).toBe(296)
    expect(hederaTestnet.nativeCurrency).toEqual({ name: 'HBAR', symbol: 'HBAR', decimals: 18 })
    expect(hederaTestnet.testnet).toBe(true)
    const url = hederaTestnet.rpcUrls.default.http[0]
    expect(url).toMatch(/^https?:\/\//)
  })
})
