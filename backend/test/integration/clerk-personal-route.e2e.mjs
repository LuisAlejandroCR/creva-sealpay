// clerk-personal-route.e2e.mjs: a real end-to-end check that a personal route on the backend is
// gated by a Clerk token it verifies itself, then forwarded to the private service with X-User-Id.
// Run with: node test/integration/clerk-personal-route.e2e.mjs  (from backend/)
// Not part of `vitest run` — it stands up real HTTP servers on loopback.
import http from "node:http";
import { generateKeyPairSync, createSign } from "node:crypto";
import express from "express";
import { createClerkAuth } from "../../dist/auth/clerk-auth.js";
import { InMemoryClerkIdentityStore } from "../../dist/auth/identity-store.js";
import { ClerkTokenVerifier } from "../../dist/core-safe/clerk/clerk-token-verifier.js";
import { BusinessLogicClient } from "../../dist/business-logic-client.js";
import { personalRouter } from "../../dist/routes/personal.js";

const ISSUER = "http://127.0.0.1:8791";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
}

async function main() {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: "jwk" }), kid: "k1", alg: "RS256", use: "sig" };

  // 1. mock JWKS
  const jwks = http.createServer((_req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ keys: [jwk] }));
  });
  await new Promise((r) => jwks.listen(8791, "127.0.0.1", r));

  // 2. mock private business-logic service
  let lastHeaders = null;
  const core = http.createServer((req, res) => {
    lastHeaders = req.headers;
    if (req.headers.authorization !== "Bearer TEST-SERVICE-TOKEN") {
      res.statusCode = 401;
      res.end(JSON.stringify({ message: "bad service token" }));
      return;
    }
    if (!req.headers["x-user-id"]) {
      res.statusCode = 401;
      res.end(JSON.stringify({ message: "Missing X-User-Id header" }));
      return;
    }
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ status: "scored", score: 71, xUserId: req.headers["x-user-id"] }));
  });
  await new Promise((r) => core.listen(8792, "127.0.0.1", r));

  // 3. backend app wired with a real verifier + in-memory identity + real client
  const store = new InMemoryClerkIdentityStore();
  store.seed({ clerkUserId: "clerk_sub_1", userId: "auth-uuid-1", email: "e2e@creva.test" });
  const verifier = new ClerkTokenVerifier({ jwksUrl: `${ISSUER}/jwks`, issuer: ISSUER });
  const client = new BusinessLogicClient({
    baseUrl: "http://127.0.0.1:8792",
    serviceToken: "TEST-SERVICE-TOKEN",
  });
  const app = express();
  app.use(express.json());
  app.use(personalRouter({ auth: createClerkAuth({ verifier, identity: store }), client }));
  const server = app.listen(8790, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));

  // helper: sign a JWT for our mock issuer
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "RS256", typ: "JWT", kid: "k1" });
  const payload = b64({ sub: "clerk_sub_1", iss: ISSUER, email: "e2e@creva.test", iat: now, exp: now + 300 });
  const signer = createSign("RSA-SHA256");
  signer.update(`${head}.${payload}`);
  signer.end();
  const jwt = `${head}.${payload}.${signer.sign(privateKey).toString("base64url")}`;

  // ── assertions ────────────────────────────────────────────────────────────
  const noToken = await fetch("http://127.0.0.1:8790/score");
  console.log(`no token  -> ${noToken.status}`);
  if (noToken.status !== 401) fail(`expected 401 without a token, got ${noToken.status}`);

  const badToken = await fetch("http://127.0.0.1:8790/score", {
    headers: { Authorization: "Bearer not-a-jwt" },
  });
  console.log(`bad token -> ${badToken.status}`);
  if (badToken.status !== 401) fail(`expected 401 for a bad token, got ${badToken.status}`);

  const ok = await fetch("http://127.0.0.1:8790/score", {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const body = await ok.json();
  console.log(`valid token -> ${ok.status} ${JSON.stringify(body)}`);
  if (ok.status !== 200) fail(`expected 200 with a valid token, got ${ok.status}`);
  if (body.score !== 71) fail(`expected the mock service payload through, got ${JSON.stringify(body)}`);
  if (lastHeaders?.["x-user-id"] !== "auth-uuid-1") {
    fail(`expected X-User-Id: auth-uuid-1 at the private service, got ${lastHeaders?.["x-user-id"]}`);
  }
  if (lastHeaders?.authorization !== "Bearer TEST-SERVICE-TOKEN") {
    fail(`expected service bearer at the private service, got ${lastHeaders?.authorization}`);
  }
  if (JSON.stringify(lastHeaders).includes(jwt)) fail("the Clerk token leaked to the private service");

  await Promise.all([
    new Promise((r) => server.close(r)),
    new Promise((r) => core.close(r)),
    new Promise((r) => jwks.close(r)),
  ]);
  console.log(process.exitCode ? "E2E FAILED" : "E2E PASSED");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
