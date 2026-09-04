// sealClient.ts: typed mock of the /verify sealed-report endpoint until the real gateway lands.
// Verdict set and disclosure copy follow brainstorming.md §0.2: the seal is Ed25519-signed,
// carries a spoken folio, five verdicts, and states explicitly what it does NOT certify.
export type Verdict = {
  label: string;
  status: "verified" | "unverified" | "not_found";
  detail: string;
};

export type SealedReport = {
  folio: string;
  signedAt: string;
  signatureAlgorithm: "Ed25519";
  verdicts: [Verdict, Verdict, Verdict, Verdict, Verdict];
  doesNotCertify: string[];
  valid: boolean;
};

const DOES_NOT_CERTIFY = [
  "Creditworthiness or probability of default",
  "Legal authorization to operate",
  "Tax compliance beyond the checked registries",
  "Future business performance",
];

export async function fetchSealedReport(folio: string): Promise<SealedReport> {
  return {
    folio,
    signedAt: new Date().toISOString(),
    signatureAlgorithm: "Ed25519",
    verdicts: [
      { label: "DOF registry", status: "verified", detail: "Business found, active" },
      { label: "CNBV registry", status: "verified", detail: "No sanctions on record" },
      { label: "SAT tax status", status: "verified", detail: "Active RFC" },
      { label: "Address match", status: "unverified", detail: "Could not cross-reference" },
      { label: "Beneficial owner", status: "not_found", detail: "Not in queried sources" },
    ],
    doesNotCertify: DOES_NOT_CERTIFY,
    valid: true,
  };
}

export async function verifySealSignature(folio: string): Promise<{ valid: boolean }> {
  return { valid: folio.length > 0 };
}
