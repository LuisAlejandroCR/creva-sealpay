// clerk-webhook.ts: verifies Svix-signed Clerk deliveries and applies them to the identity map.
// Adapted from creva_finance/backend/src/modules/webhooks/clerk-webhook.{controller,service}.ts:
// de-Nested into a plain Express handler. Verification is a single HMAC-SHA256 done here rather
// than via the svix package. The idempotent claim uses the same RPCs that already exist in the
// shared Supabase project (claim_clerk_webhook_event / release_clerk_webhook_event); no migration
// is owned here.
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { config } from "../config.js";
import { supabaseAdmin, supabaseConfigured } from "../db/supabase.js";
import {
  SupabaseClerkIdentityStore,
  type ClerkIdentityStore,
} from "../auth/identity-store.js";

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;
const MAX_CLAIM_ATTEMPTS = 5;
const CLAIM_LEASE_SECONDS = 60;

type ClerkEventType = "user.created" | "user.updated" | "user.deleted";

export interface ClerkWebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

export type ClerkWebhookOutcome =
  | "linked"
  | "updated"
  | "unlinked"
  | "duplicate"
  | "ignored"
  | "exhausted";

type ClerkClaimResult = "claimed" | "processed" | "held" | "exhausted";

interface ClerkPrimaryEmail {
  email: string;
  verified: boolean;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function signingKey(): Buffer {
  const secret = config.clerkWebhookSecret;
  if (!secret) throw new Error("clerk_webhook_secret_not_configured");
  const encoded = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  return Buffer.from(encoded, "base64");
}

function matches(expected: Buffer, candidate: string): boolean {
  const received = Buffer.from(candidate, "base64");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export class ClerkWebhookVerificationError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ClerkWebhookVerificationError";
  }
}

/** Throws ClerkWebhookVerificationError for anything that is not a delivery this instance signed. */
export function verifyAndParseClerkWebhook(
  rawBody: Buffer | undefined,
  headers: { id?: string; timestamp?: string; signature?: string },
): ClerkWebhookEvent {
  if (!rawBody || rawBody.length === 0) {
    throw new ClerkWebhookVerificationError(400, "Missing raw webhook body");
  }
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) {
    throw new ClerkWebhookVerificationError(401, "Missing Svix signature headers");
  }
  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) {
    throw new ClerkWebhookVerificationError(401, "Malformed Svix timestamp");
  }
  if (Math.abs(Math.floor(Date.now() / 1000) - sentAt) > TIMESTAMP_TOLERANCE_SECONDS) {
    throw new ClerkWebhookVerificationError(401, "Webhook timestamp is outside tolerance");
  }

  const signedContent = `${id}.${timestamp}.${rawBody.toString("utf8")}`;
  const expected = createHmac("sha256", signingKey()).update(signedContent).digest();
  const accepted = signature
    .split(" ")
    .filter((entry) => entry.startsWith("v1,"))
    .some((entry) => matches(expected, entry.slice(3)));
  if (!accepted) {
    throw new ClerkWebhookVerificationError(401, "Invalid Clerk webhook signature");
  }

  const body = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
  const type = typeof body["type"] === "string" ? body["type"] : "";
  if (!type) throw new ClerkWebhookVerificationError(400, "Clerk webhook payload has no event type");
  const data = (body["data"] ?? {}) as Record<string, unknown>;
  return { type, data };
}

function readId(data: Record<string, unknown>): string | null {
  return typeof data["id"] === "string" && data["id"].length > 0 ? data["id"] : null;
}

function isVerified(address: Record<string, unknown> | undefined): boolean {
  const verification = address?.["verification"];
  return isObject(verification) && verification["status"] === "verified";
}

function readPrimaryEmailAddress(data: Record<string, unknown>): ClerkPrimaryEmail | null {
  const addresses = Array.isArray(data["email_addresses"])
    ? (data["email_addresses"] as Array<Record<string, unknown>>)
    : [];
  const primaryId = data["primary_email_address_id"];
  if (typeof primaryId !== "string" || primaryId.length === 0) return null;
  const primary = addresses.find((entry) => entry["id"] === primaryId);
  const email = primary?.["email_address"];
  if (typeof email !== "string" || email.length === 0) return null;
  return { email, verified: isVerified(primary) };
}

async function claim(svixId: string, event: ClerkWebhookEvent): Promise<ClerkClaimResult> {
  const { data, error } = await supabaseAdmin().rpc("claim_clerk_webhook_event", {
    p_svix_id: svixId,
    p_event_type: event.type,
    p_payload: event.data,
    p_max_attempts: MAX_CLAIM_ATTEMPTS,
    p_lease_seconds: CLAIM_LEASE_SECONDS,
  });
  if (error) throw new Error(`claim_failed:${error.message}`);
  const result = typeof data === "string" ? data : "";
  return result === "claimed" || result === "processed" || result === "exhausted" ? result : "held";
}

async function release(svixId: string): Promise<void> {
  // The lease covers a failure here: the claim expires on its own, so the retry is only delayed.
  try {
    await supabaseAdmin().rpc("release_clerk_webhook_event", { p_svix_id: svixId });
  } catch {
    /* swallowed on purpose */
  }
}

async function markProcessed(svixId: string): Promise<void> {
  // The work already landed. A failure here is logged-and-swallowed, not a retry (which would
  // re-apply and spend an attempt for a success).
  try {
    await supabaseAdmin()
      .from("clerk_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("svix_id", svixId);
  } catch {
    /* swallowed on purpose */
  }
}

async function apply(
  event: ClerkWebhookEvent,
  store: ClerkIdentityStore,
): Promise<ClerkWebhookOutcome> {
  const clerkUserId = readId(event.data);
  switch (event.type as ClerkEventType) {
    case "user.created": {
      if (!clerkUserId) throw new Error("clerk_event_has_no_id");
      const primary = readPrimaryEmailAddress(event.data);
      await store.linkOrCreate(clerkUserId, primary?.email ?? "", primary?.verified ?? false);
      return "linked";
    }
    case "user.updated": {
      if (!clerkUserId) throw new Error("clerk_event_has_no_id");
      const primary = readPrimaryEmailAddress(event.data);
      const verifiedEmail = primary?.verified ? primary.email : null;
      const linked = verifiedEmail
        ? await store.updateEmail(clerkUserId, verifiedEmail)
        : await store.resolveClerkSub(clerkUserId);
      if (!linked && primary) {
        await store.linkOrCreate(clerkUserId, primary.email, primary.verified);
        return "linked";
      }
      return "updated";
    }
    case "user.deleted": {
      if (!clerkUserId) throw new Error("clerk_event_has_no_id");
      await store.unlink(clerkUserId);
      return "unlinked";
    }
    default:
      return "ignored";
  }
}

export interface ClerkWebhookHandlerDeps {
  store?: ClerkIdentityStore;
}

/** Express handler for POST /webhooks/clerk. The route must use a raw-body parser. */
export async function handleClerkWebhook(
  req: Request,
  res: Response,
  deps: ClerkWebhookHandlerDeps = {},
): Promise<void> {
  if (!config.clerkWebhookSecret || !supabaseConfigured()) {
    res.status(503).json({ received: false, reason: "clerk_webhook_not_configured" });
    return;
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body : undefined;
  let event: ClerkWebhookEvent;
  try {
    event = verifyAndParseClerkWebhook(rawBody, {
      id: req.header("svix-id") ?? undefined,
      timestamp: req.header("svix-timestamp") ?? undefined,
      signature: req.header("svix-signature") ?? undefined,
    });
  } catch (error) {
    const status = error instanceof ClerkWebhookVerificationError ? error.status : 400;
    res.status(status).json({ received: false });
    return;
  }

  const svixId = req.header("svix-id") as string;
  const store = deps.store ?? new SupabaseClerkIdentityStore();

  let claimResult: ClerkClaimResult;
  try {
    claimResult = await claim(svixId, event);
  } catch {
    res.status(500).json({ received: false, reason: "claim_failed" });
    return;
  }

  if (claimResult === "exhausted") {
    res.status(200).json({ received: true, outcome: "exhausted" });
    return;
  }
  if (claimResult !== "claimed") {
    res.status(200).json({ received: true, outcome: "duplicate" });
    return;
  }

  let outcome: ClerkWebhookOutcome;
  try {
    outcome = await apply(event, store);
  } catch {
    await release(svixId);
    res.status(500).json({ received: false, reason: "apply_failed" });
    return;
  }

  await markProcessed(svixId);
  res.status(200).json({ received: true, outcome });
}
