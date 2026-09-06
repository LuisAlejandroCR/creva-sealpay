// regulatory.ts: read-only feed a Chainlink CRE workflow (or an Automation/Functions job) polls to
// learn whether a new regulatory norm has landed since it last ran, and which anchored folios it
// touches. The "new norm" signal is the core regulatory radar (GET /creva-score/radar); the folio
// set is every folio the attestation subgraph has seen (the radar scan is global by design, so a
// new small-business-credit rule applies to all anchored folios equally). Everything is wrapped so
// a slow/broken radar or subgraph yields a typed empty answer, never a thrown error or a crash
// (same pattern as creva-proxy.ts' onchain enrichment).
import type { Request, Response } from "express";
import { ethers } from "ethers";
import { config } from "./config.js";
import { getCrevaAccessToken } from "./creva-auth.js";

interface RadarAlert {
  source: string;
  kind: "publication" | "standing_rule";
  external_id: string;
  title: string;
  published_at: string | null;
  agency: string | null;
  url: string | null;
}

export interface PendingNorm {
  normId: string;
  source: string;
  externalId: string;
  title: string;
  publishedAt: string | null;
  kind: string;
}

export interface RegulatoryPendingResponse {
  since: string | null;
  sinceKind: "block" | "date" | "timestamp" | "none";
  asOf: string;
  pending: PendingNorm | null;
  matchingNorms: PendingNorm[];
  folios: string[];
  latestAttestationBlock: number | null;
  radarError?: string;
  subgraphError?: string;
}

// normId is deterministic so the CRE workflow and the contract address the same bytes32: the
// keccak256 of "<radar source>|<external id>".
export function normIdFor(source: string, externalId: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(`${source}|${externalId}`));
}

type SinceKind = RegulatoryPendingResponse["sinceKind"];

export function classifySince(raw: unknown): { kind: SinceKind; cutoffMs: number | null } {
  if (typeof raw !== "string" || raw.trim() === "") return { kind: "none", cutoffMs: null };
  const value = raw.trim();
  if (/^\d+$/.test(value)) {
    const n = Number(value);
    // A 10-digit-ish integer is a unix-seconds timestamp; anything smaller is a block height,
    // which this endpoint cannot map to a date without an archive node — it passes through as a
    // cursor only.
    if (n >= 1_000_000_000) return { kind: "timestamp", cutoffMs: n * 1000 };
    return { kind: "block", cutoffMs: null };
  }
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return { kind: "date", cutoffMs: parsed };
  return { kind: "none", cutoffMs: null };
}

function isRadarAlert(value: unknown): value is RadarAlert {
  const a = value as Record<string, unknown> | null;
  return (
    !!a &&
    typeof a.source === "string" &&
    typeof a.external_id === "string" &&
    typeof a.title === "string" &&
    (a.kind === "publication" || a.kind === "standing_rule")
  );
}

function toPendingNorm(alert: RadarAlert): PendingNorm {
  return {
    normId: normIdFor(alert.source, alert.external_id),
    source: alert.source,
    externalId: alert.external_id,
    title: alert.title,
    publishedAt: alert.published_at,
    kind: alert.kind,
  };
}

async function fetchRadarAlerts(): Promise<{ alerts: RadarAlert[]; error?: string }> {
  let token: string;
  try {
    token = await getCrevaAccessToken();
  } catch {
    return { alerts: [], error: "creva_auth_unavailable" };
  }

  try {
    const res = await fetch(`${config.crevaApiUrl}/creva-score/radar`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { alerts: [], error: `radar_http_${res.status}` };
    const json = (await res.json()) as { data?: { alerts?: unknown } };
    const raw = Array.isArray(json.data?.alerts) ? (json.data?.alerts as unknown[]) : [];
    return { alerts: raw.filter(isRadarAlert) };
  } catch (err) {
    return { alerts: [], error: err instanceof Error ? err.message : "radar_unavailable" };
  }
}

async function fetchAnchoredFolios(
  subgraphUrl: string,
): Promise<{ folios: string[]; latestBlock: number | null; error?: string }> {
  try {
    const res = await fetch(subgraphUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query:
          "{ folioAttestations(first:1000){ id } attestations(first:1,orderBy:blockNumber,orderDirection:desc){ blockNumber } }",
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return { folios: [], latestBlock: null, error: `subgraph_http_${res.status}` };
    const json = (await res.json()) as {
      data?: {
        folioAttestations?: { id?: unknown }[];
        attestations?: { blockNumber?: unknown }[];
      };
    };
    const folios = (json.data?.folioAttestations ?? [])
      .map((row) => (typeof row.id === "string" ? row.id.toLowerCase() : null))
      .filter((id): id is string => id !== null && /^0x[0-9a-f]{64}$/.test(id));
    const blockRaw = json.data?.attestations?.[0]?.blockNumber;
    const latestBlock = Number.isFinite(Number(blockRaw)) ? Math.trunc(Number(blockRaw)) : null;
    return { folios, latestBlock };
  } catch (err) {
    return {
      folios: [],
      latestBlock: null,
      error: err instanceof Error ? err.message : "subgraph_unavailable",
    };
  }
}

// newest publish date first; alerts with no date sort last but stay included.
function byPublishedAtDesc(a: RadarAlert, b: RadarAlert): number {
  if (a.published_at === b.published_at) return 0;
  if (!a.published_at) return 1;
  if (!b.published_at) return -1;
  return a.published_at < b.published_at ? 1 : -1;
}

export async function buildRegulatoryPending(sinceRaw: unknown): Promise<RegulatoryPendingResponse> {
  const { kind, cutoffMs } = classifySince(sinceRaw);
  const asOf = new Date().toISOString();

  const [{ alerts, error: radarError }, subgraph] = await Promise.all([
    fetchRadarAlerts(),
    config.subgraphUrl
      ? fetchAnchoredFolios(config.subgraphUrl)
      : Promise.resolve({ folios: [] as string[], latestBlock: null, error: "subgraph_not_configured" }),
  ]);

  const matching = alerts
    .filter((alert) => {
      if (cutoffMs === null) return true;
      if (!alert.published_at) return false;
      const at = Date.parse(alert.published_at);
      return !Number.isNaN(at) && at >= cutoffMs;
    })
    .sort(byPublishedAtDesc);

  const response: RegulatoryPendingResponse = {
    since: typeof sinceRaw === "string" && sinceRaw.trim() !== "" ? sinceRaw.trim() : null,
    sinceKind: kind,
    asOf,
    pending: matching[0] ? toPendingNorm(matching[0]) : null,
    matchingNorms: matching.map(toPendingNorm),
    folios: subgraph.folios,
    latestAttestationBlock: subgraph.latestBlock,
  };
  if (radarError) response.radarError = radarError;
  if (subgraph.error) response.subgraphError = subgraph.error;

  // Nothing to flag on-chain if there is no norm or no folio to attach it to.
  if (response.folios.length === 0) response.pending = null;

  return response;
}

export async function handleRegulatoryPending(req: Request, res: Response): Promise<void> {
  try {
    const body = await buildRegulatoryPending(req.query.since);
    res.status(200).json(body);
  } catch (err) {
    res.status(200).json({
      since: null,
      sinceKind: "none",
      asOf: new Date().toISOString(),
      pending: null,
      matchingNorms: [],
      folios: [],
      latestAttestationBlock: null,
      radarError: err instanceof Error ? err.message : "regulatory_pending_failed",
    });
  }
}
