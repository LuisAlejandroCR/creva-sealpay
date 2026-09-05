// arc-anchor.ts: anchors a sealed Creva report's canonical hash on Arc testnet as a zero-value,
// self-addressed transaction carrying the hash as calldata. This is the on-chain trace of the
// business backing: if this piece is deleted, the backing has no on-chain record (plan.md's Arc
// block, sponsor_track_rules.md descalificador #2). Reads the signer key from the environment at
// call time only — never logs or returns it, only hands the raw string to ethers' wallet parser.
import { ethers } from "ethers";

export interface ArcSignerCredentials {
  address: string;
  privateKey: string;
}

export interface ArcAnchorResult {
  txHash: string;
  explorerUrl: string;
  network: string;
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
): Promise<ArcAnchorResult> {
  if (!isValidCanonicalHash(canonicalHash)) {
    throw new Error("arc_anchor_invalid_canonical_hash");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(credentials.privateKey, provider);
  if (wallet.address.toLowerCase() !== credentials.address.toLowerCase()) {
    throw new Error("arc_signer_private_key_mismatch");
  }

  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 0n,
    data: canonicalHash,
  });
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("arc_anchor_no_receipt");
  }

  return {
    txHash: receipt.hash,
    explorerUrl: buildExplorerUrl(rpcUrl, receipt.hash),
    network,
  };
}
