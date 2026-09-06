// clerk-token-verifier.ts: verifies a Clerk session JWT against the instance JWKS.
// Signing keys are cached in process, so a normal request never waits on the network; a refresh
// only happens when the key id is unknown or the cache went stale, and never twice in a row.
//
// `azp` — the app a Clerk token was minted for — is checked only when CLERK_AUTHORIZED_PARTY is
// set, and that is deliberate. The claim is only worth anything when one instance signs for more
// than one front end, since it is what stops a token minted for app A from being spent on app B.
// This instance has a single app today, so enforcing it by default would buy no security and
// would instead break the two cases where Clerk omits `azp` entirely: a request with no Origin
// header, and a machine-to-machine token. Opt-in keeps the check ready for the day a second app
// exists — set the variable then, and the check becomes strict, an absent `azp` included.
//
// Vendored from creva_finance/backend/src/modules/auth/clerk/clerk-token-verifier.ts — see
// ../PROVENANCE.md. No changes: it was already framework-free node:crypto.
import { createPublicKey, createVerify, KeyObject } from 'node:crypto';

// Split so the guard can tell "this is not a Clerk token, try Supabase" from "this is a Clerk
// token and it is bad". Only the first group may fall through to another provider.
export type ClerkVerificationReason =
  | 'malformed'
  | 'issuer_mismatch'
  | 'unknown_key'
  | 'jwks_unavailable'
  | 'unsupported_algorithm'
  | 'bad_signature'
  | 'expired'
  | 'not_yet_valid'
  | 'missing_subject'
  | 'unauthorized_party';

const NOT_A_CLERK_TOKEN: ReadonlySet<ClerkVerificationReason> = new Set<ClerkVerificationReason>([
  'malformed',
  'issuer_mismatch',
  'unsupported_algorithm',
]);

// Nothing is wrong with the token: we could not reach what verifies it. The caller has to answer
// 503 for these, because 401 would send a whole signed-in base back through a login that cannot
// fix an unreachable JWKS.
const NOT_THE_TOKENS_FAULT: ReadonlySet<ClerkVerificationReason> =
  new Set<ClerkVerificationReason>(['jwks_unavailable']);

export class ClerkVerificationError extends Error {
  constructor(readonly reason: ClerkVerificationReason) {
    // The message is the reason and nothing else: a token or a claim must never reach a log line.
    super(reason);
    this.name = 'ClerkVerificationError';
  }

  // True when the token does not even look like it came from this Clerk instance.
  get mayBelongToAnotherProvider(): boolean {
    return NOT_A_CLERK_TOKEN.has(this.reason);
  }

  // True when the failure is ours, not the token's: retrying later is what fixes it, and no
  // amount of signing in again will.
  get isTransient(): boolean {
    return NOT_THE_TOKENS_FAULT.has(this.reason);
  }
}

export interface ClerkSession {
  sub: string;
  email: string | null;
}

export interface ClerkVerifier {
  verify(token: string): Promise<ClerkSession>;
}

export interface ClerkTokenVerifierOptions {
  // Either is enough: without a JWKS URL the standard Clerk path is derived from the issuer.
  jwksUrl?: string;
  issuer?: string;
  // The `azp` this instance accepts. Unset — the default — skips the check; see the file header.
  authorizedParty?: string;
  fetchImpl?: typeof globalThis.fetch;
  now?: () => number;
  // How long a fetched key set is trusted before the next miss refreshes it.
  cacheTtlMs?: number;
  // Floor between two network fetches, so an unknown key id cannot turn into a fetch per request.
  minRefreshIntervalMs?: number;
  clockSkewSeconds?: number;
  timeoutMs?: number;
}

interface JwtHeader {
  alg?: unknown;
  kid?: unknown;
}

interface JwtPayload {
  sub?: unknown;
  iss?: unknown;
  azp?: unknown;
  exp?: unknown;
  nbf?: unknown;
  email?: unknown;
}

const DEFAULT_CACHE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_MIN_REFRESH_INTERVAL_MS = 30 * 1000;
const DEFAULT_CLOCK_SKEW_SECONDS = 5;
const DEFAULT_TIMEOUT_MS = 5000;

const RSA_DIGESTS: Record<string, string> = {
  RS256: 'RSA-SHA256',
  RS384: 'RSA-SHA384',
  RS512: 'RSA-SHA512',
};

function decodeSegment(segment: string): unknown {
  const json = Buffer.from(segment, 'base64url').toString('utf8');
  return JSON.parse(json) as unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function jwksUrlFor(options: { jwksUrl?: string; issuer?: string }): string | undefined {
  if (options.jwksUrl) return options.jwksUrl;
  if (!options.issuer) return undefined;
  return `${options.issuer.replace(/\/+$/, '')}/.well-known/jwks.json`;
}

export class ClerkTokenVerifier implements ClerkVerifier {
  private readonly jwksUrl: string;
  private readonly issuer: string | undefined;
  private readonly authorizedParty: string | undefined;
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly now: () => number;
  private readonly cacheTtlMs: number;
  private readonly minRefreshIntervalMs: number;
  private readonly clockSkewSeconds: number;
  private readonly timeoutMs: number;

  private keys = new Map<string, KeyObject>();
  private fetchedAt = 0;
  private inFlight: Promise<void> | undefined;

  constructor(options: ClerkTokenVerifierOptions) {
    const url = jwksUrlFor(options);
    if (!url) throw new Error('ClerkTokenVerifier needs a JWKS URL or an issuer');

    this.jwksUrl = url;
    this.issuer = options.issuer;
    this.authorizedParty = options.authorizedParty || undefined;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.now = options.now ?? (() => Date.now());
    this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.minRefreshIntervalMs = options.minRefreshIntervalMs ?? DEFAULT_MIN_REFRESH_INTERVAL_MS;
    this.clockSkewSeconds = options.clockSkewSeconds ?? DEFAULT_CLOCK_SKEW_SECONDS;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async verify(token: string): Promise<ClerkSession> {
    const parts = token.split('.');
    if (parts.length !== 3) throw new ClerkVerificationError('malformed');

    const [headerSegment, payloadSegment, signatureSegment] = parts;

    let header: JwtHeader;
    let payload: JwtPayload;
    try {
      const decodedHeader = decodeSegment(headerSegment);
      const decodedPayload = decodeSegment(payloadSegment);
      if (!isObject(decodedHeader) || !isObject(decodedPayload)) {
        throw new ClerkVerificationError('malformed');
      }
      header = decodedHeader as JwtHeader;
      payload = decodedPayload as JwtPayload;
    } catch {
      throw new ClerkVerificationError('malformed');
    }

    const digest = typeof header.alg === 'string' ? RSA_DIGESTS[header.alg] : undefined;
    if (!digest) throw new ClerkVerificationError('unsupported_algorithm');
    if (typeof header.kid !== 'string' || header.kid.length === 0) {
      throw new ClerkVerificationError('unknown_key');
    }

    // The issuer is read before the signature so a token from another instance is rejected as
    // "not ours" instead of "bad signature", which is what lets `both` mode fall back.
    if (this.issuer && payload.iss !== this.issuer) {
      throw new ClerkVerificationError('issuer_mismatch');
    }

    const key = await this.keyFor(header.kid);
    const signature = Buffer.from(signatureSegment, 'base64url');
    const signed = Buffer.from(`${headerSegment}.${payloadSegment}`, 'utf8');

    const verifier = createVerify(digest);
    verifier.update(signed);
    verifier.end();
    if (!verifier.verify(key, signature)) throw new ClerkVerificationError('bad_signature');

    // Both checks read claims, so both wait for the signature: an unverified claim is input.
    this.assertWithinLifetime(payload);
    this.assertAuthorizedParty(payload);

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new ClerkVerificationError('missing_subject');
    }

    return {
      sub: payload.sub,
      email: typeof payload.email === 'string' && payload.email.length > 0 ? payload.email : null,
    };
  }

  private assertWithinLifetime(payload: JwtPayload): void {
    const nowSeconds = Math.floor(this.now() / 1000);

    // An absent `exp` is an expired token here: a session that never dies is not a session.
    if (typeof payload.exp !== 'number') throw new ClerkVerificationError('expired');
    if (nowSeconds > payload.exp + this.clockSkewSeconds) {
      throw new ClerkVerificationError('expired');
    }
    if (typeof payload.nbf === 'number' && nowSeconds < payload.nbf - this.clockSkewSeconds) {
      throw new ClerkVerificationError('not_yet_valid');
    }
  }

  private assertAuthorizedParty(payload: JwtPayload): void {
    if (!this.authorizedParty) return;
    // Strict once configured, absence included: a token with no `azp` cannot be attributed to
    // the app that is allowed to spend it, and "cannot tell" is not a reason to let it through.
    if (payload.azp !== this.authorizedParty) {
      throw new ClerkVerificationError('unauthorized_party');
    }
  }

  private async keyFor(kid: string): Promise<KeyObject> {
    const cached = this.keys.get(kid);
    if (cached && !this.isStale()) return cached;

    await this.refresh();

    const refreshed = this.keys.get(kid);
    if (refreshed) return refreshed;
    if (cached) return cached;
    throw new ClerkVerificationError('unknown_key');
  }

  private isStale(): boolean {
    return this.now() - this.fetchedAt >= this.cacheTtlMs;
  }

  private async refresh(): Promise<void> {
    if (this.inFlight) return this.inFlight;
    // Refusing the fetch is deliberate: an unknown key id must not become one request per call.
    if (this.fetchedAt > 0 && this.now() - this.fetchedAt < this.minRefreshIntervalMs) return;

    this.inFlight = this.fetchKeys().finally(() => {
      this.inFlight = undefined;
    });
    return this.inFlight;
  }

  private async fetchKeys(): Promise<void> {
    let body: unknown;
    try {
      const response = await this.fetchImpl(this.jwksUrl, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) throw new Error(`JWKS responded ${response.status}`);
      body = await response.json();
    } catch {
      throw new ClerkVerificationError('jwks_unavailable');
    }

    if (!isObject(body) || !Array.isArray(body['keys'])) {
      throw new ClerkVerificationError('jwks_unavailable');
    }

    const parsed = new Map<string, KeyObject>();
    for (const entry of body['keys'] as unknown[]) {
      if (!isObject(entry)) continue;
      const kid = entry['kid'];
      if (typeof kid !== 'string' || entry['kty'] !== 'RSA') continue;
      try {
        parsed.set(kid, createPublicKey({ key: entry as never, format: 'jwk' }));
      } catch {
        // A key we cannot import is skipped, never fatal: the set may hold others we can use.
        continue;
      }
    }

    if (parsed.size === 0) throw new ClerkVerificationError('jwks_unavailable');

    this.keys = parsed;
    this.fetchedAt = this.now();
  }
}
