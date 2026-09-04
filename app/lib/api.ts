// api.ts: the HTTP client and the response types for every backend call.
// The Authorization header carries Clerk's session token; GETs are cached in memory for 30s,
// keyed by who asked, and mutations never read or write that cache.

// No production host as a fallback: it belongs in an env var, and a stale one here quietly
// sends the whole app to a previous deployment. Missing means local development.
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

// ── Session token ───────────────────────────────────────────────────────────
// Clerk owns the session and this file runs outside React, so it cannot call useAuth():
// AuthGuard hands its own getToken over here. @clerk/clerk-expo exposes no global
// singleton equivalent to Next's window.Clerk, so there is no pre-mount fallback path —
// sessionSource is the only source, and it is unset until AuthGuard registers it.
// There is no fallback to the pre-Clerk browser token, and adding one would undo the whole
// point: the backend still accepts it, so a request signed with it comes back as somebody
// else's account. No token means no header, and a dead session gets the 401 it earns.

export interface SessionSource {
  getToken: () => Promise<string | null>
  userId: string | null
}

let sessionSource: SessionSource | null = null

/**
 * Registered by AuthGuard on every private screen, and with null on the way out.
 * The cache is dropped whenever the identity behind it changes — a cached answer outliving
 * its owner is the same leak as an outlived token, only quieter.
 */
export function setSessionSource(source: SessionSource | null): void {
  const nextUserId = source?.userId ?? null
  if (nextUserId !== (sessionSource?.userId ?? null)) clearApiCache()
  sessionSource = source
}

async function getToken(): Promise<string | null> {
  try {
    if (sessionSource) return (await sessionSource.getToken()) ?? null
    return null
  } catch {
    // An expired session makes Clerk throw here. The request still goes out, unsigned, and comes
    // back 401 — which is the answer the screen needs. Signing it with anything else is the leak.
    return null
  }
}

// ── In-memory request cache ─────────────────────────────────────────────────
// Avoids redundant refetches when the same GET is called from multiple pages
// within a short window (e.g. dashboard + cards both ask kyc.status()).
// Mutations (POST/PUT/PATCH/DELETE) skip the cache entirely.
const cache = new Map<string, { data: unknown; expiry: number }>()

// Keyed by the user, never by the token: a Clerk token rotates on its own every minute, so
// keying on it would turn every rotation into a cold cache.
function cacheKey(path: string): string {
  const userId = sessionSource?.userId ?? 'anon'
  return `${userId}:${path}`
}

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function cacheSet(key: string, data: unknown, ttlMs: number): void {
  cache.set(key, { data, expiry: Date.now() + ttlMs })
}

export function clearApiCache(): void {
  cache.clear()
}

// ── Request helpers ─────────────────────────────────────────────────────────

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isRead = !init.method || init.method === 'GET'
  const key = cacheKey(path)

  if (isRead) {
    const cached = cacheGet<T>(key)
    if (cached !== null) return cached
  }

  const token = await getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    // A body that parses to `null` (a legal JSON value) is not a parse failure, so `.catch` above
    // never sees it — `body?.message` is what keeps that case from throwing a raw TypeError.
    throw Object.assign(new Error(body?.message ?? 'Error'), { status: res.status, body })
  }

  const data = await res.json() as T

  if (isRead) cacheSet(key, data, 30_000) // 30s TTL

  return data
}

async function requestMultipart<T>(path: string, body: FormData): Promise<T> {
  const token = await getToken()
  // Content-Type is left unset on purpose: the browser adds the multipart boundary.
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw Object.assign(new Error(errorBody?.message ?? 'Error'), { status: res.status, body: errorBody })
  }
  return res.json() as Promise<T>
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  register: (email: string, password: string, firstName?: string, lastName?: string) =>
    request<{ accessToken: string; userId: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    }),

  login: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; userId: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ id: string; email: string }>('/auth/me'),

  forgotPassword: (email: string) =>
    request<{ success: boolean }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  sendPhoneCode: (phone: string) =>
    request<{ success: boolean; channel: string }>('/auth/phone/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyPhoneCode: (phone: string, code: string) =>
    request<{ verified: boolean }>('/auth/phone/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),

  getOAuthUrl: (provider: 'google' | 'apple') => {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : ''
    return request<{ url: string }>(`/auth/oauth?provider=${provider}&redirectTo=${encodeURIComponent(redirectTo)}`)
  },

  deleteMe: () => request<{ ok: true }>('/auth/me', { method: 'DELETE' }),
}

// ── KYC ──────────────────────────────────────────────────────────────────────
export const kyc = {
  status: () =>
    request<{
      kyc: { status: string } | null
      collateral: { status: string; authorization_url: string | null } | null
      availability?: { identity: boolean; onramp: boolean }
    }>('/kyc/status'),

  apply: (data: Record<string, string | undefined>) =>
    request<{ authorization_url: string; route_id: string; kyc_status: string }>('/kyc/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ── Collateral ────────────────────────────────────────────────────────────────
export const collateral = {
  get: () =>
    request<{
      status: string
      confirmed_amount: string
      pending_amount: string
      spendingCapacity: string
      asset: string
      network: string
      deposit_account: string | null
      authorization_url: string | null
    }>('/collateral'),
}

// ── Cards ─────────────────────────────────────────────────────────────────────
export const cards = {
  list: () =>
    request<{ id: string; maskedIdentifier: string; status: string; currency: string }[]>('/cards'),

  issue: (data: Record<string, unknown>) =>
    request<{ id: string; maskedIdentifier: string; status: string }>('/cards/issue', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id: string) =>
    request<{
      id: string
      maskedIdentifier: string
      status: string
      currency: string
      spendingLimit: string
    }>(`/cards/${id}`),

  freeze: (id: string) => request<void>(`/cards/${id}/freeze`, { method: 'PATCH' }),

  unfreeze: (id: string) => request<void>(`/cards/${id}/unfreeze`, { method: 'PATCH' }),
}

// ── Profiles ──────────────────────────────────────────────────────────────────
export const profiles = {
  get: () =>
    request<{
      firstName: string | null
      lastName: string | null
      phone: string | null
      email: string
      preferredLanguage: string
    }>('/profiles'),

  update: (data: { firstName?: string; lastName?: string; phone?: string }) =>
    request<{ success: boolean }>('/profiles', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getFiscal: () =>
    request<{
      rfc: string | null
      taxRegime: string | null
      businessName: string | null
      personType: string | null
      postalCode: string | null
      stateCode: number | null
      fiscalAddress: string | null
    }>('/profiles/fiscal'),

  updateFiscal: (data: {
    rfc?: string
    taxRegime?: string
    businessName?: string
    personType?: string
    postalCode?: string
    fiscalAddress?: string
    stateCode?: number
  }) =>
    request<{ success: boolean }>('/profiles/fiscal', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

// ── Transactions ──────────────────────────────────────────────────────────────
export interface Transaction {
  id: string
  merchantName: string
  amount: string
  currency: string
  transactionType: string
  businessClassification: string
  occurredAt: string
  status: string
}

export const transactions = {
  list: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString()
    return request<Transaction[]>(`/transactions${query ? `?${query}` : ''}`)
  },
}

// ── Score ─────────────────────────────────────────────────────────────────────
/** Where a score sits. The API decides it; the client only paints it. */
export type ScoreBandKey = 'excellent' | 'good' | 'fair' | 'poor'

export interface ScoreFactor {
  name: string
  score: number
  maxScore: number
  band?: ScoreBandKey
  rationale: string
}

export interface ScoreData {
  status: string
  score: number | null
  /** Sum of the factors' maxima — the scale of the gauge, never a constant. */
  maxScore?: number | null
  band?: ScoreBandKey | null
  scoreVersion: string
  periodStart: string | null
  periodEnd: string | null
  factors: ScoreFactor[] | null
}

export const score = {
  get: () => request<ScoreData>('/score'),
}

// ── Recommendations ───────────────────────────────────────────────────────────
export interface Recommendation {
  ruleId: string
  messageEs: string
  messageEn: string
  supportingData: Record<string, unknown>
}

export const recommendations = {
  get: () =>
    request<{ status: string; recommendations: Recommendation[] }>('/recommendations'),
}

// ── Credit recommendations ────────────────────────────────────────────────────
export type CreditPurpose =
  | 'capital_trabajo'
  | 'inventario'
  | 'equipo'
  | 'expansion'
  | 'imprevistos'

export type CreditEligibilityGap = 'email_not_verified' | 'phone_not_verified'

export interface CreditEligibility {
  eligible: boolean
  kycStatus: string
  kycCompleted: boolean
  emailVerified: boolean
  phoneVerified: boolean
  phoneRequired: boolean
  missing: CreditEligibilityGap[]
}

export type CreditIncomeSource = 'bank_statements' | 'declared' | 'collateral_proxy' | 'none'

export interface CreditProfile {
  observedDays: number
  monthsObserved: number
  transactionCount: number
  statementEntryCount: number
  declaredMonthCount: number
  incomeSource: CreditIncomeSource
  estimatedMonthlyIncome: string
  averageMonthlySpend: string
  spendVolatility: string
  impliedSavingsRate: string
  businessSpendRatio: string
  score: number | null
  scoreVersion: string
}

export interface CreditMatchFactor {
  name: string
  passed: boolean
  observed: string
  threshold: string
}

export interface CreditMatch {
  productId: string
  lenderName: string
  productType: string
  isReference: boolean
  amountMin: string
  amountMax: string
  amountSuggested: string
  interestRateFrom: string
  termMonthsMax: number
  fitScore: number
  matchFactors: CreditMatchFactor[]
  messageEs: string
  messageEn: string
}

export interface CreditRequest {
  amount: string
  purpose: CreditPurpose
  termMonths: number
}

export interface CreditRecommendationResult {
  status: 'ok' | 'not_eligible' | 'insufficient_data' | 'no_match'
  eligibility: CreditEligibility
  profile: CreditProfile | null
  request: CreditRequest | null
  catalogVersion: string
  catalogSources: string[]
  catalogIsReference: boolean
  matches: CreditMatch[]
}

export interface CreditSelection {
  id: string
  productId: string
  lenderName: string
  productLabel: string
  isReference: boolean
  amountSuggested: string
  interestRateFrom: string | null
  termMonthsMax: number | null
  status: 'selected' | 'kyc_started' | 'abandoned'
  kycCompleted: boolean
  createdAt: string
}

export type YearsOperating = 'lt_1' | '1_3' | '4_5' | 'gt_5'
export type SeekingFinancing = 'yes' | 'no' | 'maybe'
export type FinancingPurpose =
  | 'working_capital'
  | 'inventory'
  | 'equipment'
  | 'expansion'
  | 'debt_payment'
  | 'other'

export interface DeclaredMonth {
  month: string
  income: string
  expenses: string
}

export interface FinancialDeclaration {
  id: string
  yearsOperating: YearsOperating
  months: DeclaredMonth[]
  seekingFinancing: SeekingFinancing
  financingPurpose: FinancingPurpose | null
  acceptedAt: string
  createdAt: string
}

export const declarations = {
  latest: () => request<FinancialDeclaration | null>('/declarations'),

  create: (body: {
    yearsOperating: YearsOperating
    months: DeclaredMonth[]
    seekingFinancing: SeekingFinancing
    financingPurpose?: FinancingPurpose
    acceptedTerms: true
  }) =>
    request<FinancialDeclaration>('/declarations', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}

export const credit = {
  eligibility: () => request<CreditEligibility>('/recommendations/credit/eligibility'),

  recommend: (body: CreditRequest) =>
    request<CreditRecommendationResult>('/recommendations/credit', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  select: (body: CreditRequest & { productId: string; startKyc?: boolean }) =>
    request<CreditSelection>('/recommendations/credit/select', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  selections: () => request<CreditSelection[]>('/recommendations/credit/selections'),

  updateSelection: (id: string, status: 'kyc_started' | 'abandoned') =>
    request<CreditSelection>(`/recommendations/credit/selections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
}

// ── Bank statements ───────────────────────────────────────────────────────────
export type IdentityMatchStatus = 'matched' | 'mismatch' | 'not_found'

export interface StatementUploadResult {
  id: string | null
  fileName: string
  status: 'parsed' | 'partial' | 'failed'
  entryCount: number
  periodStart: string | null
  periodEnd: string | null
  identityMatchStatus: IdentityMatchStatus | null
  warnings: string[]
}

export interface StatementSummary {
  id: string
  fileName: string
  fileFormat: 'csv' | 'xlsx' | 'pdf'
  entryCount: number
  periodStart: string | null
  periodEnd: string | null
  status: string
  identityMatchStatus: IdentityMatchStatus
  createdAt: string
}

export type BusinessClassification = 'business' | 'personal' | 'mixed' | 'unclassified'

export interface StatementEntry {
  id: string
  occurredAt: string
  description: string
  amount: string
  direction: 'credit' | 'debit'
  businessClassification: BusinessClassification
  isManual: boolean
}

export interface StatementClassificationSummary {
  entryCount: number
  business: string
  personal: string
  mixed: string
  unclassified: string
  businessRatio: string
  unclassifiedRatio: string
}

export const statements = {
  list: () => request<StatementSummary[]>('/statements'),

  summary: () => request<StatementClassificationSummary>('/statements/summary'),

  entries: (statementId: string) =>
    request<StatementEntry[]>(`/statements/${statementId}/entries`),

  reclassify: (entryId: string, businessClassification: BusinessClassification) =>
    request<{ success: boolean }>(`/statements/entries/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ businessClassification }),
    }),

  upload: (files: File[]) => {
    const form = new FormData()
    files.forEach(file => form.append('files', file))
    return requestMultipart<{ uploaded: number; failed: number; results: StatementUploadResult[] }>(
      '/statements/upload',
      form,
    )
  },

  remove: (id: string) => request<{ success: boolean }>(`/statements/${id}`, { method: 'DELETE' }),
}

// ── Calculator ────────────────────────────────────────────────────────────────
export interface CalculatorData {
  periodStart: string
  periodEnd: string
  income: string
  expenses: string
  netProfit: string
  suggestedSalary: string
  suggestedSavings: string
  suggestedReinvestment: string
  monthlyMargin: string | null
  incomeSources: { reapCredits: string; manualIncome: string }
}

export const calculator = {
  get: (income?: string) => {
    const query = income ? `?income=${income}` : ''
    return request<CalculatorData>(`/calculator${query}`)
  },
}

// -- Creva Score: government-data signals ------------------------------------
// Field naming here is deliberately mixed and it is not an oversight: the payloads
// below come straight from the government-data layer, whose snake_case contract is
// the one the report was specified against. Only the wrapper fields Creva adds
// around them (matchedBy, searchedAs, rfcNote) follow the camelCase of the rest of
// this client.

/** Every external source answers with this envelope, including when it is down. */
export interface SourceResult<T> {
  available: boolean
  source: string
  checked_at: string | null
  data: T | null
  error?: string
}

export interface ProvenanceLevel {
  level: 'observed' | 'documentary' | 'self_declared'
  label: string
  meaning: string
}

export interface ScoreDisclosure {
  score_version: string
  kind: 'descriptive'
  window_days: number
  describes: string
  does_not_estimate: string[]
  provenance_levels: ProvenanceLevel[]
  checked_at: string
}

export type VerificationStatus = 'verified' | 'ambiguous' | 'not_listed' | 'unavailable'

export interface VerificationBadge {
  key: string
  source: string
  checked_at: string | null
  confirmed_by_rfc: boolean
  commercial_name: string | null
  state: string | null
}

export interface BusinessVerificationResult {
  status: VerificationStatus
  /** Which name matched: the business's or the holder's own. */
  matchedBy: 'business' | 'holder' | null
  badge: VerificationBadge | null
  checkedAt: string | null
  source: string | null
  searchedAs: string[]
  stateCode: number | null
  rfcNote: string | null
}

export interface RegulatoryAlert {
  source: string
  kind: 'publication' | 'standing_rule'
  external_id: string
  title: string
  published_at: string | null
  agency: string | null
  url: string | null
}

export interface RegulatoryRadar {
  alerts: RegulatoryAlert[]
  scanned_dates: string[]
  failed_dates: string[]
  sources_available: string[]
  sources_unavailable: string[]
}

export interface ReportSignal {
  key: string
  category: 'business_verification' | 'regulatory' | 'reference_rate'
  label: string
  /** No 'negative' by design: nothing here counts against the user. */
  tone: 'positive' | 'neutral' | 'unavailable'
  detail: string
  source: string
  checked_at: string | null
  evidence_url: string | null
}

export interface CrevaReport {
  generated_at: string
  subject: { business_name: string; state_code: number | null } | null
  signals: ReportSignal[]
  sources: { provider: string; dataset: string; queried_at: string | null }[]
  disclosure: ScoreDisclosure
  notes: string[]
}

export interface ReportSignature {
  algorithm: string
  key_id: string
  value: string
}

export interface ReportCertificate {
  schema: string
  algorithm: string
  generated_at: string
  /** Grouped so it can be read aloud or copied off a printed page. */
  folio: string
  report_digest: string
  signature: ReportSignature | null
  proves: string[]
  does_not_prove: string[]
  how_to_verify: string[]
}

/** What POST /creva-score/report returns: a report handed over without its seal cannot be checked. */
export interface SealedReport {
  report: CrevaReport
  certificate: ReportCertificate
}

export type ContentVerdict = 'intact' | 'altered'
export type SignatureVerdict = 'valid' | 'invalid' | 'missing' | 'unsigned' | 'no_key'

export interface CertificateVerification {
  content: ContentVerdict
  expected_digest: string
  found_digest: string
  folio: string
  signature: SignatureVerdict
  signature_detail: string
}

export interface VerifyBusinessInput {
  businessName?: string
  /** INEGI state code. Without it a common name returns thousands of rows and no badge. */
  stateCode?: number
}

export const crevaScore = {
  disclosure: () => request<ScoreDisclosure>('/creva-score/disclosure'),

  radar: () => request<SourceResult<RegulatoryRadar>>('/creva-score/radar'),

  // POST, not GET: these spend the shared provider quota, so they are never
  // replayed from the client cache on a page revisit.
  verify: (input: VerifyBusinessInput = {}) =>
    request<BusinessVerificationResult>('/creva-score/verification', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  report: (input: VerifyBusinessInput = {}) =>
    request<SealedReport>('/creva-score/report', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  // The only call in the app that runs signed out: whoever received a report has no Creva account,
  // and requiring one would make the seal useless to the only person who needs it.
  verifyReport: (sealed: { report: unknown; certificate: unknown }) =>
    request<CertificateVerification>('/creva-score/verify', {
      method: 'POST',
      body: JSON.stringify(sealed),
    }),
}
