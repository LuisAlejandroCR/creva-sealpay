// report-digest.ts: the canonical fingerprint of a report, so an alteration cannot pass unnoticed.
// Key order decides the bytes, so the canonical form sorts them: otherwise the same report
// hashes to two different values and the folio stops meaning anything.
// Vendored verbatim from creva_finance/backend/src/common/integrity/report-digest.ts — see ../PROVENANCE.md.

import { createHash } from 'node:crypto';

export const DIGEST_ALGORITHM = 'sha256';
export const CERTIFICATE_SCHEMA = 'creva-report-certificate/v1';

export function digestOf(contents: Buffer | string): string {
  return createHash(DIGEST_ALGORITHM).update(contents).digest('hex');
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`);

  return `{${entries.join(',')}}`;
}

/**
 * The number printed inside the report itself. It covers the report's content, not the file
 * bytes, so it can be shown on the page without changing the very digest it states.
 */
export function reportFolio(report: unknown): string {
  return digestOf(canonicalJson(report));
}

/** Grouped for reading aloud or copying off a printed page. */
export function formatFolio(folio: string): string {
  return (folio.slice(0, 32).match(/.{1,8}/g) ?? []).join('-').toUpperCase();
}
