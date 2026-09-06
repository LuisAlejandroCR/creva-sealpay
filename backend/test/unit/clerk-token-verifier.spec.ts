// clerk-token-verifier.spec.ts: the Clerk JWT verifier against a mock JWKS (acceptance criterion 1).
import { describe, it, expect } from "vitest";
import {
  ClerkTokenVerifier,
  ClerkVerificationError,
} from "../../src/core-safe/clerk/clerk-token-verifier.js";
import { makeKeypair, signJwt, jwksFetch } from "../helpers/clerk-jwt.js";

const ISSUER = "https://clerk.example.com";

function verifier(fetchImpl: typeof globalThis.fetch, opts: Record<string, unknown> = {}) {
  return new ClerkTokenVerifier({
    jwksUrl: `${ISSUER}/.well-known/jwks.json`,
    issuer: ISSUER,
    fetchImpl,
    ...opts,
  });
}

describe("ClerkTokenVerifier", () => {
  it("accepts a well-formed token signed by a JWKS key", async () => {
    const kp = makeKeypair();
    const v = verifier(jwksFetch([kp.jwk]));
    const session = await v.verify(
      signJwt(kp, { sub: "user_abc", iss: ISSUER, email: "a@b.com" }),
    );
    expect(session).toEqual({ sub: "user_abc", email: "a@b.com" });
  });

  it("rejects a token whose signature does not verify", async () => {
    const signingKp = makeKeypair();
    const otherKp = makeKeypair("test-kid-1"); // same kid, different key
    const v = verifier(jwksFetch([otherKp.jwk]));
    await expect(v.verify(signJwt(signingKp, { iss: ISSUER }))).rejects.toMatchObject({
      reason: "bad_signature",
    });
  });

  it("rejects an expired token", async () => {
    const kp = makeKeypair();
    const v = verifier(jwksFetch([kp.jwk]));
    await expect(
      v.verify(signJwt(kp, { iss: ISSUER, expiresInSeconds: -60 })),
    ).rejects.toMatchObject({ reason: "expired" });
  });

  it("treats a token from another issuer as not-a-Clerk-token (falls through)", async () => {
    const kp = makeKeypair();
    const v = verifier(jwksFetch([kp.jwk]));
    try {
      await v.verify(signJwt(kp, { iss: "https://evil.example" }));
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ClerkVerificationError);
      expect((e as ClerkVerificationError).mayBelongToAnotherProvider).toBe(true);
    }
  });

  it("reports an unreachable JWKS as transient (503, not 401)", async () => {
    const kp = makeKeypair();
    const v = verifier(jwksFetch([kp.jwk], "down"));
    try {
      await v.verify(signJwt(kp, { iss: ISSUER }));
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ClerkVerificationError);
      expect((e as ClerkVerificationError).isTransient).toBe(true);
    }
  });

  it("enforces azp only when an authorized party is configured", async () => {
    const kp = makeKeypair();
    const strict = verifier(jwksFetch([kp.jwk]), { authorizedParty: "app_expected" });
    await expect(
      strict.verify(signJwt(kp, { iss: ISSUER, azp: "app_other" })),
    ).rejects.toMatchObject({ reason: "unauthorized_party" });
    await expect(
      strict.verify(signJwt(kp, { iss: ISSUER, azp: "app_expected" })),
    ).resolves.toMatchObject({ sub: expect.any(String) });
  });
});
