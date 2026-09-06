// business-input.ts: validates the business-name + state inputs of the paid query before they
// reach requestSignal. Mirrors creva_finance/frontend/app/business-verification/page.tsx (name
// required, trim length > 1, at page.tsx:236) and its INEGI state selector (page.tsx:341-353).
import { MX_STATES } from "../../lib/mx-states";

export const STATE_OPTIONS = MX_STATES.map((state) => ({
  value: String(state.code),
  label: state.label,
}));

export function isValidBusinessName(name: string): boolean {
  return name.trim().length > 1;
}

/** "" (no state picked) → undefined, so requestSignal omits stateCode entirely. */
export function toStateCode(raw: string): number | undefined {
  if (raw === "") return undefined;
  const code = Number(raw);
  return Number.isInteger(code) && MX_STATES.some((state) => state.code === code) ? code : undefined;
}

export function buildSignalInput(
  name: string,
  rawState: string,
): { businessName: string; stateCode?: number } {
  return { businessName: name.trim(), stateCode: toStateCode(rawState) };
}
