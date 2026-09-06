// onchainRead.ts: a real read-only call against the Hedera JSON-RPC Relay through the viem
// `defineChain(296)` config in privyChain.ts. Used by the smoke script and by wallet tests that
// opt into hitting the live relay. No signing, no funds moved — eth_chainId + eth_getBalance only.
import { createPublicClient, http, type Chain } from 'viem'

import { hederaTestnet } from './privyChain'

// Hedera account 0.0.2 (network treasury) — its EVM alias is the zero-padded long-zero address.
export const HEDERA_TREASURY_EVM_ADDRESS = '0x0000000000000000000000000000000000000002' as const

export interface HederaChainReadResult {
  rpcUrl: string
  chainId: number
  blockNumber: bigint
  probedAddress: string
  balanceWei: bigint
}

export function hederaPublicClient(chain: Chain = hederaTestnet) {
  return createPublicClient({ chain, transport: http() })
}

/**
 * readHederaChain: proves the `defineChain(296)` config resolves a live relay — asserts the
 * reported chain id matches 296, then pulls a block number and a known-account balance.
 */
export async function readHederaChain(
  address: string = HEDERA_TREASURY_EVM_ADDRESS,
  chain: Chain = hederaTestnet,
): Promise<HederaChainReadResult> {
  const client = hederaPublicClient(chain)
  const [chainId, blockNumber, balanceWei] = await Promise.all([
    client.getChainId(),
    client.getBlockNumber(),
    client.getBalance({ address: address as `0x${string}` }),
  ])
  if (chainId !== chain.id) {
    throw new Error(`hedera_chain_id_mismatch: relay reported ${chainId}, config expects ${chain.id}`)
  }
  return {
    rpcUrl: chain.rpcUrls.default.http[0],
    chainId,
    blockNumber,
    probedAddress: address,
    balanceWei,
  }
}
