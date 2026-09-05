// structure.spec.ts: MoreSheet ("Todo lo demás") lists all 11 target items — Mi perfil and Ayuda
// route to the existing ProfileScreen/HelpScreen (not duplicated), the other 9 route through
// onOpenStub to a real stub screen defined in stub-topics.ts, none of them dead ends.
import { readFileSync } from "fs";
import { join } from "path";
import { STUB_TOPICS } from "../../../features/more/stub-topics";

const source = readFileSync(join(__dirname, "../../../features/more/MoreSheet.tsx"), "utf-8");

const EXPECTED_STUB_LABELS = [
  "Movimientos",
  "Calculadora",
  "Estados de cuenta",
  "Tu garantía",
  "Sello de tu negocio",
  "Reglas que te afectan",
  "Tu reporte",
  "Avisos",
  "Aviso de privacidad",
];

describe("MoreSheet structure", () => {
  it("stub-topics.ts defines exactly the 9 non-duplicated Más items", () => {
    expect(STUB_TOPICS.map((t) => t.label).sort()).toEqual([...EXPECTED_STUB_LABELS].sort());
  });

  it("routes Mi perfil and Ayuda to the existing screens instead of a stub", () => {
    expect(source).toMatch(/label="Mi perfil"[^]*?onPress=\{onOpenProfile\}/);
    expect(source).toMatch(/label="Ayuda"[^]*?onPress=\{onOpenHelp\}/);
  });

  it("routes every other item through onOpenStub, never left as a bare label", () => {
    expect(source).toMatch(/onPress=\{\(\) => onOpenStub\(item\.key\)\}/);
  });

  it("uses the shared SVG icon set, not emoji", () => {
    expect(source).toMatch(/from "\.\.\/shared\/icons\/Icon"/);
  });
});
