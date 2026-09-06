// supabase.ts: the Supabase client wrapper for backend/. Points at the SAME project creva_finance
// uses (clerk_identities, clerk_webhook_events and the claim/release RPCs already live there —
// no migration is owned here). Adapted from creva_finance/backend/src/database/supabase.service.ts:
// de-Nested, admin-only (backend never establishes a user session against Supabase — Clerk owns
// that), and lazy so the process boots without SUPABASE_* when Clerk auth is disabled.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config.js";

let cached: SupabaseClient | null = null;

/**
 * The service-role client. Throws if SUPABASE_* is missing — every caller here (identity store,
 * Clerk webhook) needs it, and a silent undefined would surface as a confusing 500 later.
 */
export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = config.supabaseUrl;
  const serviceRoleKey = config.supabaseServiceRoleKey;
  if (!url || !serviceRoleKey) {
    throw new Error("supabase_not_configured");
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** True when SUPABASE_* is present, so the caller can degrade instead of throwing. */
export function supabaseConfigured(): boolean {
  return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
}

/** Test-only: drop the cached client so each test starts clean. */
export function resetSupabaseForTests(): void {
  cached = null;
}
