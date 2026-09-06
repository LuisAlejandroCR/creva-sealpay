// creva-proxy.ts: forwards a paid-for request to Creva's real API and relays its response.
// Authenticates as the Bazantic service account via getCrevaAccessToken() — never a static JWT.
// For /creva-score/verify it additionally queries the attestation subgraph and appends an
// `onchain` block: the core's content/signature verdict is passed through byte-for-byte, the
// on-chain trust signal is added alongside it. A subgraph that is down, slow, or returns garbage
// yields `onchain: null` + `onchainError` and never changes the core verdict or crashes the route
// (try/catch pattern, learned from the facilitator.ts crash).
import type { Request, Response } from "express";
import { config } from "./config.js";
import { getCrevaAccessToken } from "./creva-auth.js";
import { trustSignalFor, type OnchainAttestation } from "./types.js";

const FOLIO_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;

// The gateway keys attestations by the sealed report's digest, 0x-prefixed and lowercased. The app
// passes this same value to /creva-score/anchor as canonicalHash, so both sides address one bytes32.
export function folioHashFromDigest(digest: unknown): string | null {
  if (typeof digest !== "string") return null;
  const prefixed = digest.startsWith("0x") ? digest : `0x${digest}`;
  return FOLIO_HASH_PATTERN.test(prefixed) ? prefixed.toLowerCase() : null;
}

interface SubgraphFolio {
  attestationCount: number;
  distinctAttesters: number;
  lastAttestedAt: string | null;
}

export async function queryFolioAttestation(
  folioHash: string,
  subgraphUrl: string,
): Promise<OnchainAttestation> {
  const res = await fetch(subgraphUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query:
        "query($id: ID!){ folioAttestation(id:$id){ attestationCount distinctAttesters lastAttestedAt } }",
      variables: { id: folioHash },
    }),
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`subgraph_http_${res.status}`);

  const json = (await res.json()) as { data?: { folioAttestation?: SubgraphFolio | null } };
  const folio = json.data?.folioAttestation ?? null;

  const distinctAttesters = Number.isFinite(Number(folio?.distinctAttesters))
    ? Math.max(0, Math.trunc(Number(folio?.distinctAttesters)))
    : 0;
  const attestationCount = Number.isFinite(Number(folio?.attestationCount))
    ? Math.max(0, Math.trunc(Number(folio?.attestationCount)))
    : 0;
  const lastAttestedAt =
    folio && folio.lastAttestedAt != null ? String(folio.lastAttestedAt) : null;

  return {
    attestationCount,
    distinctAttesters,
    lastAttestedAt,
    trustSignal: trustSignalFor(distinctAttesters),
  };
}

async function enrichWithOnchain(coreBody: string): Promise<string> {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(coreBody) as Record<string, unknown>;
  } catch {
    return coreBody;
  }

  if (!config.subgraphUrl) {
    return JSON.stringify({ ...parsed, onchain: null, onchainError: "subgraph_not_configured" });
  }

  const folioHash =
    folioHashFromDigest(parsed.expected_digest) ?? folioHashFromDigest(parsed.found_digest);
  if (!folioHash) {
    return JSON.stringify({ ...parsed, onchain: null, onchainError: "no_folio_hash" });
  }

  try {
    const onchain = await queryFolioAttestation(folioHash, config.subgraphUrl);
    return JSON.stringify({ ...parsed, onchain });
  } catch (err) {
    return JSON.stringify({
      ...parsed,
      onchain: null,
      onchainError: err instanceof Error ? err.message : "subgraph_unavailable",
    });
  }
}

export async function proxyToCreva(
  req: Request,
  res: Response,
  path: string,
  enrichOnchainVerify = false,
) {
  let accessToken: string;
  try {
    accessToken = await getCrevaAccessToken();
  } catch {
    // Never proxy without a valid Authorization header — a request Creva can't authenticate
    // is not a request worth sending it.
    res.status(502).json({ error: "creva_auth_unavailable" });
    return;
  }

  const upstream = await fetch(`${config.crevaApiUrl}${path}`, {
    method: req.method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    body: req.method === "GET" ? undefined : JSON.stringify(req.body),
  });

  let body = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "application/json";

  if (enrichOnchainVerify && upstream.ok && contentType.includes("json")) {
    body = await enrichWithOnchain(body);
  }

  res.status(upstream.status);
  res.setHeader("content-type", contentType);
  res.send(body);
}
