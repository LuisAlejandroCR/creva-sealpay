// identity-store.ts: the bridge between a Clerk session subject and a Creva user row.
// Every foreign key in the schema still points at auth.users(id), so a Clerk user only becomes
// usable once it owns one of those rows and clerk_identities records which one.
//
// Adapted from creva_finance/backend/src/modules/auth/clerk-identity.service.ts: de-Nested,
// logger injected, and split into an interface with a Supabase impl (production) and an in-memory
// impl (tests). The shared Supabase project already has the clerk_identities table and the
// auth.users adoption rules; this file only talks to it.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthUser } from "../core-safe/types/auth-user.js";
import type { ClerkUserMapping } from "../core-safe/clerk/clerk-user-mapping.port.js";
import { UNLINKED_CLERK_ACCOUNT } from "../core-safe/clerk/unlinked-clerk-account.js";
import { supabaseAdmin } from "../db/supabase.js";

export interface ClerkIdentity {
  clerkUserId: string;
  userId: string;
  email: string | null;
}

export interface ClerkIdentityStore extends ClerkUserMapping {
  /** The auth middleware's entry point: a Clerk `sub` in, the Creva user it owns out, or null. */
  resolveClerkSub(sub: string): Promise<AuthUser | null>;
  /** Idempotent link, used by the Clerk webhook on user.created / user.updated. */
  linkOrCreate(clerkUserId: string, email: string, emailVerified: boolean): Promise<ClerkIdentity>;
  /** Follows an address change in Clerk; only the mapping's email moves, never auth.users. */
  updateEmail(clerkUserId: string, email: string): Promise<ClerkIdentity | null>;
  /** Drops the mapping row and nothing else (no cascade into user data). */
  unlink(clerkUserId: string): Promise<boolean>;
}

export interface IdentityLogger {
  warn(message: string): void;
  error(message: string): void;
}

const consoleIdentityLogger: IdentityLogger = {
  warn: (m) => console.warn(`[clerk-identity] ${m}`),
  error: (m) => console.error(`[clerk-identity] ${m}`),
};

interface ClerkIdentityRow {
  clerk_user_id: string;
  user_id: string;
  email: string | null;
}

const IDENTITY_COLUMNS = "clerk_user_id, user_id, email";
const AUTH_USERS_PAGE_SIZE = 200;
const AUTH_USERS_MAX_PAGES = 50;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toIdentity(row: ClerkIdentityRow): ClerkIdentity {
  return { clerkUserId: row.clerk_user_id, userId: row.user_id, email: row.email };
}

export class SupabaseClerkIdentityStore implements ClerkIdentityStore {
  constructor(
    private readonly db: SupabaseClient = supabaseAdmin(),
    private readonly logger: IdentityLogger = consoleIdentityLogger,
  ) {}

  async resolveClerkSub(clerkUserId: string): Promise<AuthUser | null> {
    if (!clerkUserId) return null;

    const { data, error } = await this.db
      .from("clerk_identities")
      .select(IDENTITY_COLUMNS)
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle<ClerkIdentityRow>();

    if (error) {
      this.logger.error(`Clerk identity lookup failed: ${error.message}`);
      throw new Error("clerk_identity_lookup_failed");
    }

    return data ? { id: data.user_id, email: data.email ?? "" } : null;
  }

  async linkOrCreate(
    clerkUserId: string,
    email: string,
    emailVerified: boolean,
  ): Promise<ClerkIdentity> {
    const existing = await this.resolveIdentity(clerkUserId);
    if (existing) return existing;

    const normalized = normalizeEmail(email);
    if (!normalized) throw new Error("clerk_identity_needs_email");

    const existingAuthUserId = await this.findAuthUserIdByEmail(normalized);

    // Creating a fresh auth.users row from an unverified address gives away nothing. Adopting an
    // existing one hands over whatever that user already owns, so emailVerified gates adoption alone.
    if (existingAuthUserId && !emailVerified) {
      this.logger.warn(
        `Refused to adopt an existing Creva user for Clerk subject ${clerkUserId}: primary email not verified`,
      );
      throw new Error(UNLINKED_CLERK_ACCOUNT);
    }

    const authUserId = existingAuthUserId ?? (await this.createAuthUser(normalized));
    return this.insertIdentity(clerkUserId, authUserId, normalized);
  }

  async updateEmail(clerkUserId: string, email: string): Promise<ClerkIdentity | null> {
    const normalized = normalizeEmail(email);
    if (!normalized) return this.resolveIdentity(clerkUserId);

    const { data, error } = await this.db
      .from("clerk_identities")
      .update({ email: normalized })
      .eq("clerk_user_id", clerkUserId)
      .select(IDENTITY_COLUMNS)
      .maybeSingle<ClerkIdentityRow>();

    if (error) {
      this.logger.error(`Clerk identity email update failed: ${error.message}`);
      throw new Error("clerk_identity_update_failed");
    }
    return data ? toIdentity(data) : null;
  }

  async unlink(clerkUserId: string): Promise<boolean> {
    const { data, error } = await this.db
      .from("clerk_identities")
      .delete()
      .eq("clerk_user_id", clerkUserId)
      .select("clerk_user_id");

    if (error) {
      this.logger.error(`Clerk identity unlink failed: ${error.message}`);
      throw new Error("clerk_identity_unlink_failed");
    }
    return (data ?? []).length > 0;
  }

  private async resolveIdentity(clerkUserId: string): Promise<ClerkIdentity | null> {
    if (!clerkUserId) return null;
    const { data, error } = await this.db
      .from("clerk_identities")
      .select(IDENTITY_COLUMNS)
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle<ClerkIdentityRow>();
    if (error) {
      this.logger.error(`Clerk identity lookup failed: ${error.message}`);
      throw new Error("clerk_identity_lookup_failed");
    }
    return data ? toIdentity(data) : null;
  }

  private async insertIdentity(
    clerkUserId: string,
    userId: string,
    email: string,
  ): Promise<ClerkIdentity> {
    const { data, error } = await this.db
      .from("clerk_identities")
      .insert({ clerk_user_id: clerkUserId, user_id: userId, email })
      .select(IDENTITY_COLUMNS)
      .maybeSingle<ClerkIdentityRow>();

    if (error) {
      // Two deliveries of the same user.created can race. Whoever lost re-reads.
      const raced = await this.resolveIdentity(clerkUserId);
      if (raced) return raced;
      this.logger.error(`Clerk identity insert failed: ${error.message}`);
      throw new Error("clerk_identity_insert_failed");
    }
    if (!data) throw new Error("clerk_identity_insert_failed");
    return toIdentity(data);
  }

  private async findAuthUserIdByEmail(email: string): Promise<string | null> {
    for (let page = 1; page <= AUTH_USERS_MAX_PAGES; page += 1) {
      const { data, error } = await this.db.auth.admin.listUsers({
        page,
        perPage: AUTH_USERS_PAGE_SIZE,
      });
      if (error) {
        this.logger.error(`Auth user lookup failed: ${error.message}`);
        throw new Error("auth_user_lookup_failed");
      }
      const users = data?.users ?? [];
      const match = users.find((u) => normalizeEmail(u.email ?? "") === email);
      if (match) return match.id;
      if (users.length < AUTH_USERS_PAGE_SIZE) return null;
    }
    this.logger.warn("Auth user lookup hit the page ceiling before finding a match");
    return null;
  }

  private async createAuthUser(email: string): Promise<string> {
    const { data, error } = await this.db.auth.admin.createUser({ email, email_confirm: true });
    if (error || !data?.user) {
      const existingId = await this.findAuthUserIdByEmail(email);
      if (existingId) return existingId;
      this.logger.error(`Auth user creation failed: ${error?.message ?? "unknown error"}`);
      throw new Error("auth_user_creation_failed");
    }
    return data.user.id;
  }
}

/** In-memory store for tests and for a local run with no Supabase. Adoption rules kept minimal. */
export class InMemoryClerkIdentityStore implements ClerkIdentityStore {
  private readonly bySub = new Map<string, ClerkIdentity>();
  private readonly byEmail = new Map<string, string>();
  private seq = 0;

  seed(identity: ClerkIdentity): void {
    this.bySub.set(identity.clerkUserId, identity);
    if (identity.email) this.byEmail.set(normalizeEmail(identity.email), identity.userId);
  }

  async resolveClerkSub(sub: string): Promise<AuthUser | null> {
    const found = this.bySub.get(sub);
    return found ? { id: found.userId, email: found.email ?? "" } : null;
  }

  async linkOrCreate(
    clerkUserId: string,
    email: string,
    emailVerified: boolean,
  ): Promise<ClerkIdentity> {
    const existing = this.bySub.get(clerkUserId);
    if (existing) return existing;

    const normalized = normalizeEmail(email);
    if (!normalized) throw new Error("clerk_identity_needs_email");

    const existingUserId = this.byEmail.get(normalized);
    if (existingUserId && !emailVerified) throw new Error(UNLINKED_CLERK_ACCOUNT);

    const userId = existingUserId ?? `user_${(this.seq += 1)}`;
    const identity: ClerkIdentity = { clerkUserId, userId, email: normalized };
    this.bySub.set(clerkUserId, identity);
    this.byEmail.set(normalized, userId);
    return identity;
  }

  async updateEmail(clerkUserId: string, email: string): Promise<ClerkIdentity | null> {
    const existing = this.bySub.get(clerkUserId);
    if (!existing) return null;
    const updated = { ...existing, email: normalizeEmail(email) };
    this.bySub.set(clerkUserId, updated);
    return updated;
  }

  async unlink(clerkUserId: string): Promise<boolean> {
    return this.bySub.delete(clerkUserId);
  }
}
