// config.ts: environment-driven gateway settings, read once at startup. Non-secret
// values (URLs, IDs, flags) come straight from process.env; sensitive secrets are
// resolved through the Ledger Key Ring backend (see key-ring.ts) with an automatic
// process.env fallback, so behavior is unchanged when KEY_RING_ENABLED is not set.
import "dotenv/config";
import { keyRingEnabled, resolveSecret } from "./key-ring.js";

export const config = {
  port: Number(process.env.PORT ?? 8787),
  crevaApiUrl: process.env.CREVA_API_URL ?? "https://creva-backend-c7as7id5jq-pv.a.run.app",
  crevaServiceRefreshToken: process.env.CREVA_SERVICE_REFRESH_TOKEN,
  facilitatorUrl: process.env.FACILITATOR_URL ?? "http://localhost:4020",
  facilitatorAuthToken: process.env.FACILITATOR_AUTH_TOKEN,
  facilitatorFeePayer: process.env.FACILITATOR_FEE_PAYER,
  x402Version: Number(process.env.X402_VERSION ?? 1),
  payToAddress: process.env.PAY_TO_ADDRESS ?? "0.0.0000000",
  network: process.env.HEDERA_NETWORK ?? "hedera:testnet",
  asset: process.env.PAYMENT_ASSET ?? "0.0.0",
  reportPriceAtomic: process.env.REPORT_PRICE_ATOMIC ?? "10000000",
  verifyPriceAtomic: process.env.VERIFY_PRICE_ATOMIC ?? "5000000",
  worldApiKey: process.env.WORLD_API_KEY,
  worldAppId: process.env.WORLD_APP_ID,
  worldVerifyUrl: process.env.WORLD_VERIFY_URL ?? "https://developer.world.org/api/v4/verify",
  worldRpId: process.env.WORLD_RP_ID,
  worldRpSigningKey: process.env.WORLD_RP_SIGNING_KEY,
  worldEnvironment: process.env.WORLD_ENVIRONMENT,
  arcRpcUrl: process.env.ARC_RPC_URL,
  arcNetwork: process.env.ARC_NETWORK ?? "arc:testnet",
  arcSignerAddress: process.env.ARC_SIGNER_ADDRESS,
  arcSignerPrivateKey: process.env.ARC_SIGNER_PRIVATE_KEY,
  registryAddress: process.env.REGISTRY_ADDRESS,
  subgraphUrl: process.env.SUBGRAPH_URL,

  // ── Private business-logic service (creva-business-logic) ──────────────────
  // The deployed Creva core for score / creva-score / classification / recommendations /
  // collateral / calculator / declarations. Replaces the old proxy to creva_finance on Cloud
  // Run for what this service owns. Missing means those routes degrade to "unavailable".
  businessLogicUrl: process.env.BUSINESS_LOGIC_URL,
  // Fixed service bearer, compared with timingSafeEqual on the service side. Personal-data
  // context travels separately in the X-User-Id header — never inferred from this token.
  coreServiceToken: process.env.CORE_SERVICE_TOKEN,

  // ── Clerk (backend validates the mobile app's session token itself) ────────
  // Either the JWKS URL or the issuer is enough — the well-known path derives from the issuer.
  clerkJwksUrl: process.env.CLERK_JWKS_URL,
  clerkIssuer: process.env.CLERK_ISSUER,
  // Checked only when set; see core-safe/clerk/clerk-token-verifier.ts header.
  clerkAuthorizedParty: process.env.CLERK_AUTHORIZED_PARTY,
  // Svix signing secret (whsec_...) for POST /webhooks/clerk. Missing => the route refuses every delivery.
  clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET,

  // ── Supabase (SAME project as creva_finance — clerk_identities lives there) ─
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// Secret env-var names routed through the Key Ring. Kept as env names (not config
// keys) so frozen consumers that read process.env directly (arc-anchor.ts,
// hedera-signer.ts) also pick up Key Ring values after hydration.
const SECRET_ENV_KEYS = [
  "CREVA_SERVICE_REFRESH_TOKEN",
  "FACILITATOR_AUTH_TOKEN",
  "HEDERA_PAYER_PRIVATE_KEY",
  "WORLD_API_KEY",
  "ARC_SIGNER_PRIVATE_KEY",
  "CORE_SERVICE_TOKEN",
  "CLERK_WEBHOOK_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

/**
 * Resolve every sensitive secret through the Key Ring backend and apply it to
 * `config` and to process.env (for direct-env consumers). No-op unless
 * KEY_RING_ENABLED=true. Returns the names that were sourced from the Key Ring
 * rather than env - names only, never values.
 */
export async function hydrateSecrets(): Promise<string[]> {
  if (!keyRingEnabled()) return [];
  const fromRing: string[] = [];
  for (const name of SECRET_ENV_KEYS) {
    const envBefore = process.env[name];
    const resolved = await resolveSecret(name);
    if (resolved === undefined) continue;
    if (resolved !== envBefore) fromRing.push(name);
    process.env[name] = resolved;
  }
  config.crevaServiceRefreshToken = process.env.CREVA_SERVICE_REFRESH_TOKEN;
  config.facilitatorAuthToken = process.env.FACILITATOR_AUTH_TOKEN;
  config.worldApiKey = process.env.WORLD_API_KEY;
  config.arcSignerPrivateKey = process.env.ARC_SIGNER_PRIVATE_KEY;
  config.coreServiceToken = process.env.CORE_SERVICE_TOKEN;
  config.clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  config.supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return fromRing;
}

// Startup hydration: awaited at module load so every importer sees resolved
// secrets. Costs one microtask when KEY_RING_ENABLED is unset.
await hydrateSecrets();
