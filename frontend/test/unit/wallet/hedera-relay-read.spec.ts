/**
 * @jest-environment node
 */
// hedera-relay-read.spec.ts: opt-in live check that defineChain(296) resolves a real relay.
// Skipped by default (network). Run with:  RUN_HEDERA_RELAY_TEST=1 npx jest hedera-relay-read
// Delegates to the standalone smoke script (features/wallet/smoke-read-chain.mjs), which runs
// outside jest's module sandbox where viem's http transport behaves; that script is the
// canonical proof cited in docs/integrations/privy-hedera.md.
import { execFileSync } from 'child_process'
import { join } from 'path'

const maybe = process.env.RUN_HEDERA_RELAY_TEST ? describe : describe.skip

maybe('Hedera JSON-RPC Relay (live, via smoke script)', () => {
  it('reports chain id 296 and a positive block number', () => {
    const out = execFileSync('node', [join(__dirname, '../../../features/wallet/smoke-read-chain.mjs')], {
      encoding: 'utf8',
      timeout: 45_000,
    })
    const json = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1))
    expect(json.chainId).toBe(296)
    expect(Number(json.blockNumber)).toBeGreaterThan(0)
    expect(out).toContain('OK: defineChain(296) resolves a live Hedera testnet relay')
  }, 60_000)
})
