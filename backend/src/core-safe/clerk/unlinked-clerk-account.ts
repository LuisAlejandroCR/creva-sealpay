// unlinked-clerk-account.ts: the one message the API uses for "this Clerk session has no Creva user".
// It lives apart from the middleware because two layers must agree on it: the auth middleware raises
// it when the map has no row, and the identity map raises it when it refuses to adopt a row it does
// not trust. Vendored from creva_finance — see ../PROVENANCE.md.
export const UNLINKED_CLERK_ACCOUNT = 'Clerk account is not linked to a Creva user';
