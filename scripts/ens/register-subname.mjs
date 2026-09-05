// register-subname.mjs: registers creva.eth on Sepolia via ENSv2's ETHRegistrar (paid in Sepolia
// USDC, not ETH — the legacy ENSv1 ETHRegistrarController is deprecated on Sepolia and reverts).
// Addresses below were confirmed on 2026-09-05 against live Blockscout data (verified contract
// names, constructor-arg cross-references, and real LabelRegistered events), not just ENS docs.
// Reads ENS_OWNER_ADDRESS / ENS_OWNER_PRIVATE_KEY / ALCHEMY_API_KEY from the repo-root .env.
import 'dotenv/config'
import { ethers } from 'ethers'

const ETH_REGISTRAR = '0xa88553F454b77203B0D036A05c894d555EAAa2Cc' // ENSv2 .eth registrar (new registrations)
const ETH_REGISTRY = '0xBDC85dD5b15D7ecb354cd7cb6f2c50b4f2c4F0E2' // ENSv2 .eth PermissionedRegistry
const PUBLIC_RESOLVER_V2 = '0xe7b9a25607e02da8145e4eb1836ca539e53f11f7'
const SEPOLIA_USDC = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // Circle faucet token

const ERC20_ABI = ['function approve(address spender, uint256 amount) returns (bool)', 'function balanceOf(address) view returns (uint256)']
const REGISTRAR_ABI = [
  'function isAvailable(string label) view returns (bool)',
  'function getRegisterPrice(string label, uint64 duration, address paymentToken) view returns (uint256 base, uint256 premium)',
  'function makeCommitment(string label, address owner, bytes32 secret, address subregistry, address resolver, uint64 duration, bytes32 referrer) pure returns (bytes32)',
  'function commit(bytes32 commitment)',
  'function commitmentAt(bytes32) view returns (uint256)',
  'function MIN_COMMITMENT_AGE() view returns (uint64)',
  'function register(string label, address owner, bytes32 secret, address subregistry, address resolver, uint64 duration, address paymentToken, bytes32 referrer) returns (uint256 tokenId)',
]
const REGISTRY_ABI = [
  'function getSubregistry(string label) view returns (address)',
  'function getResolver(string label) view returns (address)',
]

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

async function main() {
  const ownerAddress = requireEnv('ENS_OWNER_ADDRESS')
  const ownerPrivateKey = requireEnv('ENS_OWNER_PRIVATE_KEY')
  const alchemyKey = requireEnv('ALCHEMY_API_KEY')

  const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`)
  const wallet = new ethers.Wallet(ownerPrivateKey, provider)
  if (wallet.address.toLowerCase() !== ownerAddress.toLowerCase()) {
    throw new Error('ENS_OWNER_PRIVATE_KEY does not match ENS_OWNER_ADDRESS')
  }

  const registrar = new ethers.Contract(ETH_REGISTRAR, REGISTRAR_ABI, wallet)
  const registry = new ethers.Contract(ETH_REGISTRY, REGISTRY_ABI, provider)
  const usdc = new ethers.Contract(SEPOLIA_USDC, ERC20_ABI, wallet)

  const evidence = {}
  const duration = 60n * 60n * 24n * 365n // 1 year

  const alreadyResolver = await registry.getResolver('creva')
  if (alreadyResolver !== ethers.ZeroAddress) {
    console.log('creva.eth already registered (resolver set) — skipping registration.')
  } else {
    const available = await registrar.isAvailable('creva')
    if (!available) throw new Error('creva.eth is not available and has no resolver set — unexpected state')

    const price = await registrar.getRegisterPrice('creva', duration, SEPOLIA_USDC)
    const totalCost = price.base + price.premium
    const usdcBalance = await usdc.balanceOf(wallet.address)
    console.log(`Price: ${ethers.formatUnits(totalCost, 6)} USDC, balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`)
    if (usdcBalance < totalCost) throw new Error('Insufficient Sepolia USDC balance')

    const secret = ethers.hexlify(ethers.randomBytes(32))
    const commitment = await registrar.makeCommitment(
      'creva',
      wallet.address,
      secret,
      ethers.ZeroAddress, // subregistry: none yet — set later once a subname registry is deployed
      PUBLIC_RESOLVER_V2,
      duration,
      ethers.ZeroHash,
    )

    console.log('Submitting commitment...')
    const commitTx = await registrar.commit(commitment)
    const commitReceipt = await commitTx.wait()
    evidence.commitTxHash = commitReceipt.hash
    console.log(`Commit tx: ${commitReceipt.hash}`)

    const minAge = await registrar.MIN_COMMITMENT_AGE()
    const waitMs = Number(minAge) * 1000 + 5000
    console.log(`Waiting ${waitMs}ms for MIN_COMMITMENT_AGE...`)
    await new Promise((resolve) => setTimeout(resolve, waitMs))

    console.log('Approving USDC spend...')
    const approveTx = await usdc.approve(ETH_REGISTRAR, totalCost * 2n)
    const approveReceipt = await approveTx.wait()
    evidence.approveTxHash = approveReceipt.hash
    console.log(`Approve tx: ${approveReceipt.hash}`)

    console.log('Registering creva.eth...')
    const registerTx = await registrar.register(
      'creva',
      wallet.address,
      secret,
      ethers.ZeroAddress,
      PUBLIC_RESOLVER_V2,
      duration,
      SEPOLIA_USDC,
      ethers.ZeroHash,
    )
    const registerReceipt = await registerTx.wait()
    evidence.registerTxHash = registerReceipt.hash
    console.log(`Register tx: ${registerReceipt.hash}`)
  }

  console.log('\n=== EVIDENCE ===')
  console.log(JSON.stringify(evidence, null, 2))
  console.log('Explorer: https://sepolia.app.ens.domains/creva.eth')
}

main().catch((err) => {
  console.error('FAILED:', err.message)
  process.exit(1)
})
