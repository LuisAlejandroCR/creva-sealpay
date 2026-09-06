// clerk-user-mapping.port.ts: the port that turns a Clerk `sub` into the Supabase auth user.
// Ten foreign keys point at auth.users(id), so the id on the request is always that UUID and
// never the Clerk subject; the implementation behind this port owns the lookup.
// Vendored from creva_finance — see ../PROVENANCE.md. DI Symbol dropped (Express, not Nest).
import type { AuthUser } from '../types/auth-user.js';

export interface ClerkUserMapping {
  // Resolves the linked Supabase user, or null when this Clerk account has no row yet.
  resolveClerkSub(sub: string): Promise<AuthUser | null>;
}
