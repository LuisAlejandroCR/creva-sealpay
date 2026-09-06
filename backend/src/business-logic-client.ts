// business-logic-client.ts: the HTTP client backend/ uses to reach the private creva-business-logic
// service (the deployed Creva core — score, creva-score, classification, recommendations, collateral,
// calculator, declarations, read-only transactions). It replaces the old proxy to creva_finance on
// Cloud Run for everything that service now owns; creva-proxy.ts stays for whatever is still on the
// old core (cards, kyc, profiles, statements).
//
// Two hard invariants, both covered by test/invariant:
//   1. It never issues a request without CORE_SERVICE_TOKEN. A missing token degrades to a typed
//      "unavailable" result before any fetch — it is not an outage to hide, it is a misconfig.
//   2. A 5xx (or a timeout, or a network error) from the private service is a typed value, never a
//      thrown exception. Nothing here can take backend/ down.
//
// Personal-data calls carry X-User-Id: <auth.users UUID>, resolved by clerk-auth.ts from the mobile
// app's Clerk token. The service trusts that header for the personal context; CORE_SERVICE_TOKEN
// only authenticates the service-to-service hop. Service identity is never the personal context.
import { config } from "./config.js";
import {
  type SourceResult,
  sourceOk,
  sourceUnavailable,
} from "./core-safe/types/source-result.js";
import {
  type SourceLogger,
  noopSourceLogger,
} from "./core-safe/logging/source-logger.js";

const DEFAULT_TIMEOUT_MS = 15_000;

export interface BusinessLogicClientOptions {
  baseUrl?: string;
  serviceToken?: string;
  fetchImpl?: typeof globalThis.fetch;
  timeoutMs?: number;
  logger?: SourceLogger;
}

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export class BusinessLogicClient {
  private readonly baseUrl: string | undefined;
  private readonly serviceToken: string | undefined;
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly timeoutMs: number;
  private readonly logger: SourceLogger;

  constructor(options: BusinessLogicClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? config.businessLogicUrl)?.replace(/\/+$/, "");
    this.serviceToken = options.serviceToken ?? config.coreServiceToken;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.logger = options.logger ?? noopSourceLogger;
  }

  /** True only when both the URL and the service token are present. */
  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.serviceToken);
  }

  /**
   * A per-user call. `userId` is the auth.users UUID; a blank one degrades before any fetch —
   * the private service would 401 it anyway, and sending it would be a bug worth catching here.
   */
  async callForUser<T>(
    userId: string,
    method: HttpMethod,
    path: string,
    body?: unknown,
  ): Promise<SourceResult<T>> {
    const source = `business-logic:${path}`;
    if (!userId) {
      this.logger.log("warn", "business-logic.skipped", { path, reason: "missing_user_id" });
      return sourceUnavailable<T>(source, "missing_user_id");
    }
    return this.dispatch<T>(source, method, path, body, { "X-User-Id": userId });
  }

  /** A call that carries no personal context (e.g. the public seal verification). */
  async callPublic<T>(method: HttpMethod, path: string, body?: unknown): Promise<SourceResult<T>> {
    return this.dispatch<T>(`business-logic:${path}`, method, path, body, {});
  }

  private async dispatch<T>(
    source: string,
    method: HttpMethod,
    path: string,
    body: unknown,
    extraHeaders: Record<string, string>,
  ): Promise<SourceResult<T>> {
    // Invariant 1: no token, no request. Ever.
    if (!this.serviceToken) {
      this.logger.log("error", "business-logic.skipped", {
        path,
        reason: "core_service_token_not_configured",
      });
      return sourceUnavailable<T>(source, "core_service_token_not_configured");
    }
    if (!this.baseUrl) {
      this.logger.log("error", "business-logic.skipped", { path, reason: "business_logic_url_not_configured" });
      return sourceUnavailable<T>(source, "business_logic_url_not_configured");
    }

    const startedAt = Date.now();
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.serviceToken}`,
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
          ...extraHeaders,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        // Invariant 2: a 5xx (or 4xx) is a typed value. The body is not surfaced — it could carry
        // detail that must not leak — only the status.
        this.logger.log("warn", "business-logic.call", {
          path,
          status: response.status,
          elapsed_ms: Date.now() - startedAt,
        });
        return sourceUnavailable<T>(source, `http_${response.status}`, new Date().toISOString());
      }

      const data = (await response.json().catch(() => null)) as T | null;
      if (data === null) {
        return sourceUnavailable<T>(source, "empty_payload", new Date().toISOString());
      }
      this.logger.log("info", "business-logic.call", {
        path,
        status: response.status,
        elapsed_ms: Date.now() - startedAt,
      });
      return sourceOk<T>(source, data);
    } catch (error) {
      // Timeout, DNS failure, connection reset — all typed, none thrown.
      const reason =
        error instanceof Error
          ? error.name === "TimeoutError"
            ? "timeout"
            : error.name === "AbortError"
              ? "timeout"
              : "network_error"
          : "unknown_error";
      this.logger.log("warn", "business-logic.call", {
        path,
        error: reason,
        elapsed_ms: Date.now() - startedAt,
      });
      return sourceUnavailable<T>(source, `request_failed:${reason}`, new Date().toISOString());
    }
  }
}

// Lazily-built singleton for the route wiring.
let cached: BusinessLogicClient | null = null;

export function businessLogicClient(): BusinessLogicClient {
  if (!cached) cached = new BusinessLogicClient();
  return cached;
}

export function resetBusinessLogicClientForTests(): void {
  cached = null;
}
