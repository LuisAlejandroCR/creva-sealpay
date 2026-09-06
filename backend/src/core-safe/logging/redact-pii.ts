// redact-pii.ts: strips personally identifiable fields from objects before they reach logs.
// Vendored verbatim from creva_finance/backend/src/common/utils/redact-pii.ts — see ../PROVENANCE.md.

// Matched by normalized-key substring (lowercase, underscores stripped), so it catches every
// naming convention seen across providers in one pass: firstName/first_name, dob,
// otpPhoneNumber/phone, email, curp, rfc, residentialAddress/address,
// idDocumentNumber/idDocumentType, and the CLABE (stored as `clabe` or, in Dynerox route
// payloads, under the generic `account` key).
const SENSITIVE_KEY_STEMS = [
  'firstname',
  'lastname',
  'dob',
  'phone',
  'email',
  'rfc',
  'curp',
  'address',
  'iddocument',
  'clabe',
  'account',
];

const REDACTED = '[REDACTED]';
const MAX_DEPTH = 10;

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/_/g, '');
}

function isSensitiveKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEY_STEMS.some((stem) => normalized.includes(stem));
}

/**
 * Returns a deep copy of `value` with sensitive fields replaced by "[REDACTED]".
 * Safe to call on arbitrary provider payloads before JSON.stringify-ing them to logs.
 */
export function redactPii(value: unknown, depth = 0): unknown {
  if (depth >= MAX_DEPTH || value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactPii(item, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = isSensitiveKey(key) ? REDACTED : redactPii(val, depth + 1);
  }
  return result;
}
