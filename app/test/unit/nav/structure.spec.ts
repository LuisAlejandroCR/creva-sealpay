// structure.spec.ts: App.tsx's bottom nav has the target 5-item shape (Inicio, Score, Tarjeta
// disabled/PRONTO, Crédito, Más) and every previously-dead-end callback (Dashboard's
// credit/card/notifications, Profile's five menu rows, Help's article/category rows) is now wired
// to a real setStep call instead of being left undefined.
import { readFileSync } from "fs";
import { join } from "path";

const source = readFileSync(join(__dirname, "../../../App.tsx"), "utf-8");

describe("App.tsx bottom nav structure", () => {
  it("defines exactly the five target tabs, in order", () => {
    const labels = ["Inicio", "Score", "Tarjeta", "Crédito", "Más"];
    let cursor = -1;
    for (const label of labels) {
      const index = source.indexOf(`label: "${label}"`);
      expect(index).toBeGreaterThan(cursor);
      cursor = index;
    }
  });

  it("marks the Tarjeta tab disabled with a PRONTO badge, not tappable", () => {
    expect(source).toMatch(/key:\s*"card"[^}]*disabled:\s*true/s);
    expect(source).toMatch(/PRONTO/);
    expect(source).toMatch(/disabled=\{tab\.disabled\}/);
  });

  it("wires every no-op callback the UI audit found to a real navigation handler", () => {
    expect(source).toMatch(/onOpenCredit=\{\(\) => setStep\("credit"\)\}/);
    expect(source).toMatch(/onOpenCard=\{\(\) => setStep\("card-info"\)\}/);
    expect(source).toMatch(/onOpenNotifications=\{\(\) => openStub\("notifications", "home"\)\}/);
    expect(source).toMatch(/onOpenDetails=\{\(\) => setStep\("profile-details"\)\}/);
    expect(source).toMatch(/onOpenFiscal=\{\(\) => setStep\("profile-fiscal"\)\}/);
    expect(source).toMatch(/onOpenSecurity=\{\(\) => setStep\("profile-security"\)\}/);
    expect(source).toMatch(/onOpenDeleteAccount=\{\(\) => setStep\("profile-delete-account"\)\}/);
    expect(source).toMatch(/onOpenArticle=\{openHelpArticle\}/);
    expect(source).toMatch(/onOpenCategory=\{openHelpCategory\}/);
  });

  it("opens the Más sheet (MoreSheet) instead of leaving Más unimplemented", () => {
    expect(source).toMatch(/import \{ MoreSheet \} from "\.\/features\/more\/MoreSheet"/);
    expect(source).toMatch(/step === "more"/);
  });

  it("uses the shared SVG icon set for tab glyphs, not emoji", () => {
    expect(source).toMatch(/import \{ Icon, type IconName \} from "\.\/features\/shared\/icons\/Icon"/);
    expect(source).toMatch(/<Icon name=\{tab\.icon\}/);
  });

  it("reproduces creva_finance's three active-tab signals (globals.css lines 176-199): the icon's own fill switch, the bold weight jump, and the top edge indicator — not color alone", () => {
    expect(source).toMatch(/filled=\{active\}/);
    expect(source).toMatch(/font-extrabold/);
    expect(source).toMatch(/border-t-\[3px\]/);
    expect(source).toMatch(/active \? "border-crimson" : "border-transparent"/);
  });
});
