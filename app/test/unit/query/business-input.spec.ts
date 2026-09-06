// business-input.spec.ts: QueryScreen collects the business name + state from the user (prefilled
// from the fiscal profile) and feeds requestSignal({ businessName, stateCode }) — no more hardcoded
// BUSINESS_NAME. Validation mirrors creva_finance's business-verification/page.tsx.
import { readFileSync } from "fs";
import { join } from "path";
import { MX_STATES } from "../../../lib/mx-states";
import {
  STATE_OPTIONS,
  buildSignalInput,
  isValidBusinessName,
  toStateCode,
} from "../../../features/query/business-input";

const screen = readFileSync(
  join(__dirname, "../../../features/query/QueryScreen.tsx"),
  "utf-8",
);

describe("business-input helpers", () => {
  it("requires a real business name (trim length > 1)", () => {
    expect(isValidBusinessName("")).toBe(false);
    expect(isValidBusinessName("  ")).toBe(false);
    expect(isValidBusinessName("A")).toBe(false);
    expect(isValidBusinessName("Café Majo")).toBe(true);
  });

  it("maps the state selector value to an INEGI code, or undefined when unset/bogus", () => {
    expect(toStateCode("")).toBeUndefined();
    expect(toStateCode("not-a-number")).toBeUndefined();
    expect(toStateCode("999")).toBeUndefined();
    expect(toStateCode(String(MX_STATES[0].code))).toBe(MX_STATES[0].code);
  });

  it("exposes exactly the INEGI catalog as select options", () => {
    expect(STATE_OPTIONS).toHaveLength(MX_STATES.length);
    expect(STATE_OPTIONS[0]).toEqual({ value: String(MX_STATES[0].code), label: MX_STATES[0].label });
  });

  it("builds the requestSignal input with a trimmed name and an optional code", () => {
    expect(buildSignalInput("  Panadería  ", "")).toEqual({ businessName: "Panadería", stateCode: undefined });
    expect(buildSignalInput("Panadería", String(MX_STATES[5].code))).toEqual({
      businessName: "Panadería",
      stateCode: MX_STATES[5].code,
    });
  });
});

describe("QueryScreen wiring", () => {
  it("has no hardcoded business name left", () => {
    expect(screen).not.toMatch(/BUSINESS_NAME|"Panader[ií]a La Espiga"/);
  });

  it("feeds requestSignal the user input in both the trigger and the pay retry", () => {
    expect(screen).toMatch(/const signalInput = \(\) => buildSignalInput\(businessName, stateCode\)/);
    expect(screen).toMatch(/requestSignal\(signalInput\(\)\)/);
    expect(screen).toMatch(/requestSignal\(signalInput\(\), paymentHeader\)/);
  });

  it("renders the name field + state selector and gates the trigger on a valid name", () => {
    expect(screen).toContain("business-name-input");
    expect(screen).toContain("business-state-select");
    expect(screen).toMatch(/disabled=\{!isValidBusinessName\(businessName\)\}/);
  });

  it("does not touch the x402 pay button or the sealing flow", () => {
    expect(screen).toMatch(/testID="pay-button"/);
    expect(screen).toMatch(/buildSignedPaymentHeader\(pendingPayment\.accepts\[0\], credentials\)/);
  });
});
