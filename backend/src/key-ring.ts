// key-ring.ts: resolves sensitive gateway secrets through a Ledger Key Ring
// (`wallet-cli ring`, LKRP) when KEY_RING_ENABLED=true, and otherwise falls back
// to process.env exactly as before. The encrypted secrets blob is a dotenv-format
// file decrypted once at startup; values are cached in memory and never logged.
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** A backend returns the raw secret string for a name, or undefined if absent. */
export type KeyRingBackend = (name: string) => Promise<string | undefined>;

let testBackend: KeyRingBackend | null = null;
let ringPromise: Promise<Map<string, string>> | null = null;

export function keyRingEnabled(): boolean {
  return process.env.KEY_RING_ENABLED === "true";
}

/** Test seam: inject a fake backend (or null to restore the real one). */
export function setKeyRingBackendForTesting(backend: KeyRingBackend | null): void {
  testBackend = backend;
  ringPromise = null;
}

function normalize(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : value;
}

function parseDotenv(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (val.length >= 2 && (val[0] === '"' || val[0] === "'") && val[val.length - 1] === val[0]) {
      val = val.slice(1, -1);
    }
    out.set(key, val);
  }
  return out;
}

async function decryptRing(): Promise<Map<string, string>> {
  const cliBin = process.env.KEY_RING_CLI ?? "wallet-cli";
  const keyName = process.env.KEY_RING_KEY_NAME ?? "creva-sealpay";
  const secretsBlob = process.env.KEY_RING_SECRETS_FILE ?? "secrets.env.enc";
  try {
    const { stdout } = await execFileAsync(
      cliBin,
      ["ring", "decrypt", "--key", keyName, "--input", secretsBlob],
      { maxBuffer: 1024 * 1024, windowsHide: true },
    );
    return parseDotenv(stdout);
  } catch {
    // Never surface the CLI's stderr/stdout (may echo ciphertext or paths). The
    // caller falls back to process.env; a genuinely missing key fails later in
    // requireSecret with the name only.
    throw new Error("key_ring_decrypt_failed");
  }
}

async function loadRing(): Promise<Map<string, string>> {
  if (!ringPromise) ringPromise = decryptRing();
  return ringPromise;
}

/**
 * Resolve one secret by env-var name. Order: test backend > Key Ring (when
 * enabled) > process.env. Returns undefined for an absent or empty value -
 * never an empty string, so callers cannot silently use "".
 */
export async function resolveSecret(name: string): Promise<string | undefined> {
  if (testBackend) return normalize(await testBackend(name));

  if (keyRingEnabled()) {
    try {
      const ring = await loadRing();
      const fromRing = normalize(ring.get(name));
      if (fromRing !== undefined) return fromRing;
    } catch {
      // fall through to env
    }
  }
  return normalize(process.env[name]);
}

/** Like resolveSecret but throws (name only, never the value) when absent in every backend. */
export async function requireSecret(name: string): Promise<string> {
  const value = await resolveSecret(name);
  if (value === undefined) {
    throw new Error(`missing required secret: ${name}`);
  }
  return value;
}
