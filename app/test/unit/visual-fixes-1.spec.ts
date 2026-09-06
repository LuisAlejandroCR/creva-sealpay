// visual-fixes-1.spec.ts: Agent 2's first visual-parity pass — the copy/layout fixes applied on
// feature-visual-fixes-1. Source-string checks against each screen and its creva_finance reference.
import { readFileSync } from "fs";
import { join } from "path";
import { buildReminders, pendingCount } from "../../lib/reminders";

const read = (p: string) => readFileSync(join(__dirname, "../..", p), "utf-8");

const dashboard = read("features/dashboard/DashboardScreen.tsx");
const selfie = read("features/onboarding/SelfieCheckScreen.tsx");
const query = read("features/query/QueryScreen.tsx");
const moreSheet = read("features/more/MoreSheet.tsx");
const del = read("features/profile/DeleteAccountScreen.tsx");
const app = read("App.tsx");
const segmented = read("features/profile/components/FormField.tsx");

describe("DashboardScreen", () => {
  it("greeting keeps the comma even with no name (ref dashboard/page.tsx:199 `Hola, ${userName}`)", () => {
    expect(dashboard).toMatch(/"Hola,\{userName \? ` \$\{userName\}` : ""\}"|>Hola,\{userName/);
    expect(dashboard).not.toMatch(/Hola\{userName \? `, /);
  });

  it("does not fabricate credit/statement state to feed the notification badge", () => {
    expect(dashboard).not.toMatch(/creditEligible: true/);
    expect(dashboard).not.toMatch(/statementCount: 2/);
    expect(dashboard).toMatch(/creditEligible: null/);
    expect(dashboard).toMatch(/statementCount: null/);
  });

  it("buildReminders with only score known yields zero pending (bell shows no count)", () => {
    const reminders = buildReminders({
      scoreStatus: "ok",
      scoreValue: 72,
      creditEligible: null,
      creditMissing: [],
      statementCount: null,
      statementEntryCount: null,
    });
    expect(pendingCount(reminders)).toBe(0);
  });
});

describe("SelfieCheckScreen", () => {
  it("uses the crimson CTA, not bg-text (black)", () => {
    expect(selfie).not.toMatch(/bg-text px-6 py-3/);
    expect(selfie.match(/rounded-full bg-crimson px-6 py-3/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("puts Back top-left via CenteredState, not inside the centred column", () => {
    expect(selfie).toMatch(/function CenteredState/);
    expect(selfie).not.toMatch(/items-center justify-center gap-4 px-6[^]*?BackButton/);
  });
});

describe("copy / brand fixes", () => {
  it("QueryScreen shows 'Creva', never 'SealPay' as visible text", () => {
    expect(query).not.toMatch(/>Creva SealPay</);
    expect(query).toMatch(/text-text\/60">Creva</);
  });

  it("DeleteAccountScreen matches the reference title + subtitle (delete-account/page.tsx:30-31)", () => {
    expect(del).toContain("Eliminar tu cuenta");
    expect(del).toContain("No es un botón porque no se puede deshacer.");
  });
});

describe("MoreSheet", () => {
  it("has a Cerrar control wired to onClose", () => {
    expect(moreSheet).toMatch(/onClose: \(\) => void/);
    expect(moreSheet).toMatch(/onPress=\{onClose\}[^]*?Cerrar/);
    expect(app).toMatch(/onClose=\{\(\) => setStep\("home"\)\}/);
  });
});

describe("SegmentedField", () => {
  it("clamps option labels to one line so they cannot clip a narrow control", () => {
    expect(segmented).toMatch(/numberOfLines=\{1\}/);
  });
});
