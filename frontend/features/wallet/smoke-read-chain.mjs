// smoke-read-chain.mjs: standalone proof that the Hedera JSON-RPC Relay is reachable through the
// same viem chain config Privy will use. Run with:  node app/features/wallet/smoke-read-chain.mjs
// Override the endpoint with EXPO_PUBLIC_HEDERA_JSON_RPC_URL. Read-only, no keys, no funds moved.
import { createPublicClient, defineChain, http } from 'viem'

const rpcUrl = process.env.EXPO_PUBLIC_HEDERA_JSON_RPC_URL || 'https://testnet.hashio.io/api'

const hederaTestnet = defineChain({
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  testnet: true,
})

const client = createPublicClient({ chain: hederaTestnet, transport: http() })
const address = '0x0000000000000000000000000000000000000002'

const [chainId, blockNumber, balanceWei] = await Promise.all([
  client.getChainId(),
  client.getBlockNumber(),
  client.getBalance({ address }),
])

console.log(JSON.stringify({ rpcUrl, chainId, blockNumber: blockNumber.toString(), address, balanceWei: balanceWei.toString() }, null, 2))

if (chainId !== 296) {
  console.error(`FAIL: relay reported chain id ${chainId}, expected 296`)
  process.exit(1)
}
console.log('OK: defineChain(296) resolves a live Hedera testnet relay')
