// types.ts: verification outcomes for the World Selfie Check onboarding step.
export type SelfieCheckStatus =
  | 'idle'
  | 'in_progress'
  | 'verified'
  | 'failed'
  | 'identity_unavailable'

export interface SelfieCheckResult {
  status: SelfieCheckStatus
  // World's nullifier_hash for this action, present only when status is 'verified'.
  nullifierHash: string | null
}
