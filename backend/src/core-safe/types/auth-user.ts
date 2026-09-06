// auth-user.ts: the identity attached to a request after Clerk verification + mapping.
// Extracted from creva_finance/backend/src/common/types/internal.types.ts (only AuthUser) —
// see ../PROVENANCE.md. The id is always the auth.users UUID, never the Clerk subject.
export interface AuthUser {
  id: string;
  email: string;
}
