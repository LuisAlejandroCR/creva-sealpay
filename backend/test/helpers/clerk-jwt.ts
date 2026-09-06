// clerk-jwt.ts: test helper. Mints RS256 JWTs and a matching JWKS so the Clerk verifier can be
// exercised without a real Clerk instance.
import { createSign, generateKeyPairSync, type KeyObject } from "node:crypto";

export interface TestKeypair {
  privateKey: KeyObject;
  jwk: Record<string, unknown>;
  kid: string;
}

export function makeKeypair(kid = "test-kid-1"): TestKeypair {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: "jwk" }), kid, alg: "RS256", use: "sig" };
  return { privateKey, jwk, kid };
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export interface SignJwtOptions {
  sub?: string;
  iss?: string;
  email?: string;
  azp?: string;
  expiresInSeconds?: number;
  nbfOffsetSeconds?: number;
  kid?: string;
  alg?: string;
}

export function signJwt(kp: TestKeypair, opts: SignJwtOptions = {}): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: opts.alg ?? "RS256", typ: "JWT", kid: opts.kid ?? kp.kid };
  const payload: Record<string, unknown> = {
    sub: opts.sub ?? "user_clerk_123",
    iss: opts.iss,
    email: opts.email,
    azp: opts.azp,
    iat: now,
    exp: now + (opts.expiresInSeconds ?? 300),
  };
  if (opts.nbfOffsetSeconds !== undefined) payload.nbf = now + opts.nbfOffsetSeconds;
  for (const k of Object.keys(payload)) if (payload[k] === undefined) delete payload[k];

  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const sig = signer.sign(kp.privateKey).toString("base64url");
  return `${signingInput}.${sig}`;
}

/** A fetch stub that serves a JWKS at any URL and 404s everything else. */
export function jwksFetch(
  keys: Array<Record<string, unknown>>,
  behavior: "ok" | "down" = "ok",
): typeof globalThis.fetch {
  return (async () => {
    if (behavior === "down") throw new Error("network down");
    return {
      ok: true,
      status: 200,
      json: async () => ({ keys }),
    } as Response;
  }) as unknown as typeof globalThis.fetch;
}
