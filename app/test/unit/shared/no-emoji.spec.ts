// no-emoji.spec.ts: regression guard for the UI audit's icon-system finding — every emoji glyph
// found across app/features/** (🏠 👤 🔔 👁️ 🙈 🔎 ✕ 🔑 💳 🎯 📊 🧾 🛡️ 🏛️ 🔐 🚪 ❓ 🔒) must stay
// replaced by the shared SVG icon set. Mirrors the VERIFY command's grep so a regression fails a
// normal `npm test` run, not just a manual audit.
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const FEATURES_DIR = join(__dirname, "../../../features");
const EMOJI_PATTERN = /🏠|👤|🔔|👁️|🙈|🔎|✕|🔑|💳|🎯|📊|🧾|🛡️|🏛️|🔐|🚪|❓|🔒/u;

function collectFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  let files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) files = files.concat(collectFiles(full));
    else if (/\.(tsx?|jsx?)$/.test(entry)) files.push(full);
  }
  return files;
}

describe("no emoji glyphs remain under app/features", () => {
  it("every source file is emoji-free (replaced by features/shared/icons/Icon.tsx)", () => {
    const offenders: string[] = [];
    for (const file of collectFiles(FEATURES_DIR)) {
      const content = readFileSync(file, "utf-8");
      if (EMOJI_PATTERN.test(content)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});
