// world-verify-smoke.mjs: end-to-end smoke test for the World Selfie Check nonce flow against a
// RUNNING gateway. Run this once the World ID Sandbox is approved and gateway/.env has real
// WORLD_API_KEY / WORLD_APP_ID / WORLD_RP_ID / WORLD_RP_SIGNING_KEY set.
//
//   Terminal 1:  cd gateway && npm install && npm run dev
//   Terminal 2:  node scripts/world-verify-smoke.mjs [path/to/idkit-proof.json]
//
// Step 1 always runs: GET /onboarding/world-id/session must return a nonce + signature.
// Step 2 runs only when a proof JSON file is passed: it injects the freshly issued nonce into
// that proof and POSTs it to /onboarding/verify-world-id. A real proof comes from running the
// IDKit widget / hosted flow with the rp_context this script printed. Without the file, step 2
// is skipped and the script reports what is still unverified.
import { readFileSync } from "node:fs";

const GATEWAY = process.env.GATEWAY_URL ?? "http://localhost:8787";
const ACTION = process.env.WORLD_ACTION_ID ?? "selfie-check-onboarding";
const proofPath = process.argv[2];

function log(ok, msg) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
}

const sessionRes = await fetch(
  `${GATEWAY}/onboarding/world-id/session?action=${encodeURIComponent(ACTION)}`,
);
const session = await sessionRes.json();
log(
  sessionRes.status === 200 && typeof session.nonce === "string" && session.nonce.length > 0,
  `GET /onboarding/world-id/session -> ${sessionRes.status} nonce=${session.nonce?.slice(0, 12)}…`,
);
if (sessionRes.status !== 200) {
  console.error("Session route did not return 200 — is WORLD_API_KEY / WORLD_APP_ID set?");
  process.exit(1);
}
console.log("\nrp_context for the IDKit widget / hosted flow:");
console.log(
  JSON.stringify(
    {
      nonce: session.nonce,
      created_at: session.createdAt,
      expires_at: session.expiresAt,
      signature: session.signature,
    },
    null,
    2,
  ),
);

if (!proofPath) {
  console.log("\nNo proof file passed — stopping after the session step.");
  console.log(
    "STILL UNVERIFIED: the real proof round-trip. Capture an IDKit result with the rp_context",
  );
  console.log(
    "above, save it as JSON, and re-run: node scripts/world-verify-smoke.mjs proof.json",
  );
  process.exit(0);
}

const rawProof = JSON.parse(readFileSync(proofPath, "utf8"));
const proof = {
  nonce: session.nonce,
  merkle_root: rawProof.merkle_root,
  nullifier_hash: rawProof.nullifier_hash ?? rawProof.nullifier,
  proof: rawProof.proof,
  verification_level: rawProof.verification_level ?? "device",
  action: ACTION,
  ...(rawProof.signal_hash ? { signal: rawProof.signal_hash } : {}),
};

const verifyRes = await fetch(`${GATEWAY}/onboarding/verify-world-id`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(proof),
});
const body = await verifyRes.json();
log(verifyRes.status === 200 && body.verified === true, `POST /onboarding/verify-world-id -> ${verifyRes.status} ${JSON.stringify(body)}`);

// Replay: the same nonce must now be rejected.
const replayRes = await fetch(`${GATEWAY}/onboarding/verify-world-id`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(proof),
});
const replayBody = await replayRes.json();
log(
  replayRes.status === 401 && replayBody.reason === "world_verify_nonce_used",
  `replay with same nonce -> ${replayRes.status} ${JSON.stringify(replayBody)}`,
);

process.exit(verifyRes.status === 200 && body.verified === true ? 0 : 1);
