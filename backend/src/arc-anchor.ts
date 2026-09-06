// arc-anchor.ts: anchors a sealed Creva report's canonical hash on-chain by calling
// AttestationRegistry.attest(folioHash), which emits an indexable Attested event. That event is what
// the subgraph indexes and what ultimately moves the /verify trust signal — a self-addressed
// value-0 tx (the previous shape) carried the hash but emitted no log, so nothing could index it.
// Reads the signer key from the environment at call time only — never logs or returns it, only
// hands the raw string to ethers' wallet parser. The hash-shape invariant still runs before any
// wallet/provider/contract object is constructed.
import { ethers } from "ethers";

const REGISTRY_ABI = [
  "function attest(bytes32 folioHash)",
  "event Attested(bytes32 indexed folioHash, address indexed attester, uint256 timestamp)",
];

export interface ArcSignerCredentials {
  address: string;
  privateKey: string;
}

export interface ArcAnchorResult {
  txHash: string;
  explorerUrl: string;
  network: string;
  registryAddress: string;
  folioHash: string;
  attester: string;
  blockNumber: number;
}

const CANONICAL_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;

export function isValidCanonicalHash(hash: unknown): hash is string {
  return typeof hash === "string" && CANONICAL_HASH_PATTERN.test(hash);
}

export function readArcSignerCredentialsFromEnv(): ArcSignerCredentials | undefined {
  const address = process.env.ARC_SIGNER_ADDRESS;
  const privateKey = process.env.ARC_SIGNER_PRIVATE_KEY;
  if (!address || !privateKey) {
    return undefined;
  }
  return { address, privateKey };
}

// Best-effort convention (rpc.* -> explorer.*): Arc testnet's public block explorer domain is not
// yet confirmed reachable as of 2026-09-05 (checked candidate hosts, none resolved). The real
// on-chain confirmation for this integration is the mined receipt itself (status 1, real
// blockNumber/blockHash from eth_getTransactionReceipt against chainId 5042002), not this URL —
// treat this as a convenience link to update once Arc publishes its explorer.
export function buildExplorerUrl(rpcUrl: string, txHash: string): string {
  const explorerHost = rpcUrl.replace(/^https?:\/\/rpc\./, "https://explorer.");
  return `${explorerHost.replace(/\/+$/, "")}/tx/${txHash}`;
}

export async function anchorReportHash(
  canonicalHash: string,
  credentials: ArcSignerCredentials,
  rpcUrl: string,
  network: string,
  registryAddress: string | undefined,
): Promise<ArcAnchorResult> {
  if (!isValidCanonicalHash(canonicalHash)) {
    throw new Error("arc_anchor_invalid_canonical_hash");
  }
  if (!registryAddress || !ethers.isAddress(registryAddress)) {
    throw new Error("arc_anchor_registry_not_configured");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(credentials.privateKey, provider);
  if (wallet.address.toLowerCase() !== credentials.address.toLowerCase()) {
    throw new Error("arc_signer_private_key_mismatch");
  }

  const registry = new ethers.Contract(registryAddress, REGISTRY_ABI, wallet);
  const tx = await registry.attest(canonicalHash);
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("arc_anchor_no_receipt");
  }

  return {
    txHash: receipt.hash,
    explorerUrl: buildExplorerUrl(rpcUrl, receipt.hash),
    network,
    registryAddress,
    folioHash: canonicalHash.toLowerCase(),
    attester: wallet.address,
    blockNumber: receipt.blockNumber,
  };
}
