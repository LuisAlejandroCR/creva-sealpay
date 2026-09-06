// kyc-format.ts: CURP validation and Mexican phone normalisation for the KYC form.
// Ported 1:1 from creva_finance/frontend/app/kyc/page.tsx:80 (curpRx) and :90-93 (phone formatting)
// so the native form rejects and reshapes exactly what the web form did before hitting kyc.apply.
export const CURP_RX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/;

export function isValidCurp(curp: string): boolean {
  return CURP_RX.test(curp);
}

export function formatMxPhone(raw: string): string {
  let formatted = raw.replace(/[\s\-()]/g, "");
  if (formatted && !formatted.startsWith("+")) {
    formatted = "+52" + formatted.replace(/^52/, "");
  }
  return formatted;
}
