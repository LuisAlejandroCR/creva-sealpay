// source-logger.ts: logging port for the external-source clients, with redaction.
// Redaction lives in the port so no call site has to remember it.
// Vendored from creva_finance/backend/src/common/logger/source-logger.ts — see ../PROVENANCE.md.
// Adaptation: the NestJS adapter (createNestSourceLogger) is dropped; createConsoleSourceLogger
// replaces it for the Express service.

export type SourceLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface SourceLogFields {
  [key: string]: unknown;
}

export interface SourceLogger {
  log(level: SourceLogLevel, message: string, fields?: SourceLogFields): void;
}

export const noopSourceLogger: SourceLogger = {
  log: () => undefined,
};

const SECRET_KEY_PATTERN = /(key|token|secret|authorization|password)/i;
const PERSONAL_KEY_PATTERN = /(rfc|curp|email|phone|address|name)/i;
const CREDENTIAL_VALUE_PATTERN = /\b(croma_(?:live|test)_[A-Za-z0-9_-]+|Bearer\s+\S+)/gi;

export function redactSourceFields(fields: SourceLogFields): SourceLogFields {
  const safe: SourceLogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      safe[key] = '[redacted]';
    } else if (PERSONAL_KEY_PATTERN.test(key)) {
      safe[key] = value === null || value === undefined ? value : '[personal]';
    } else if (typeof value === 'string') {
      safe[key] = value.replace(CREDENTIAL_VALUE_PATTERN, '[redacted]');
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

// A plain console adapter: every call site stays testable with a fake logger, and no call site
// has to remember to redact.
export function createConsoleSourceLogger(context: string): SourceLogger {
  return {
    log(level, message, fields = {}) {
      const line = `[${context}] ${message} ${JSON.stringify(redactSourceFields(fields))}`;
      if (level === 'error') console.error(line);
      else if (level === 'warn') console.warn(line);
      else if (level === 'debug') console.debug(line);
      else console.log(line);
    },
  };
}
