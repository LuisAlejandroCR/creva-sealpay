// citation.spec.ts: asserts the icon audit's corrections actually landed — each fixed icon uses
// the exact path data from its cited creva_finance source, and the concepts the audit found
// conflated (movements vs statement, business-verification vs regulatory vs report, shield vs
// privacy vs security) now resolve to distinct glyphs instead of sharing one approximated shape.
import { readFileSync } from "fs";
import { join } from "path";

const source = readFileSync(join(__dirname, "../../../features/shared/icons/Icon.tsx"), "utf-8");

describe("Icon.tsx exact-path citations", () => {
  it("eye/eye-off match creva_finance/frontend/components/auth/PasswordField.tsx exactly", () => {
    expect(source).toMatch(/M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z/);
    expect(source).toMatch(/M17\.94 17\.94A10\.07 10\.07 0 0 1 12 20c-7 0-11-8-11-8/);
  });

  it("search/close match creva_finance/frontend/components/help/HelpSearch.tsx exactly", () => {
    expect(source).toMatch(/m16 16 4\.5 4\.5/);
    expect(source).toMatch(/M6 6l12 12M18 6L6 18/);
  });

  it("movements is its own exchange-arrows glyph, not a reuse of statement's document glyph", () => {
    expect(source).toMatch(/case "movements":/);
    expect(source).toMatch(/M4 8h13m0 0-3-3m3 3-3 3M20 16H7/);
    const movementsBlock = source.slice(source.indexOf('case "movements"'), source.indexOf('case "report"'));
    expect(movementsBlock).not.toMatch(/M14 3H7a2 2 0 0 0-2 2v14/);
  });

  it("report is its own document+circle glyph, distinct from statement and seal", () => {
    expect(source).toMatch(/case "report":/);
    const reportBlock = source.slice(source.indexOf('case "report"'), source.indexOf('case "security"'));
    expect(reportBlock).toMatch(/cx=\{12\} cy=\{14\.5\} r=\{3\}/);
  });

  it("shield (checkmark) and privacy (padlock) are separate cases, not a shared fallthrough", () => {
    const shieldIndex = source.indexOf('case "shield":');
    const privacyIndex = source.indexOf('case "privacy":');
    expect(shieldIndex).toBeGreaterThan(-1);
    expect(privacyIndex).toBeGreaterThan(-1);
    expect(source.slice(shieldIndex, privacyIndex)).not.toMatch(/case "privacy"/);
    expect(source.slice(shieldIndex, privacyIndex)).toMatch(/m9 12 2 2 4-4/);
  });

  it("security is a distinct glyph (profile/page.tsx's plain shield outline)", () => {
    expect(source).toMatch(/case "security":/);
    expect(source).toMatch(/M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z/);
  });

  it("fiscal is a distinct glyph (profile/page.tsx's folded-corner document)", () => {
    expect(source).toMatch(/case "fiscal":/);
    expect(source).toMatch(/M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z/);
  });
});
