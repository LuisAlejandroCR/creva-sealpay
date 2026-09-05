// HelpGlyph.tsx: mobile equivalent of creva_finance's components/help/HelpGlyph.tsx — one
// emoji per HelpIcon key instead of hand-drawn SVG paths, since this port avoids adding a new
// SVG dependency (same call ScoreGauge/VisualPrimitives already made for query/verify).
import { Text } from "react-native";

import type { HelpIcon } from "../../../lib/help-content";

const GLYPH: Record<HelpIcon, string> = {
  key: "🔑",
  card: "💳",
  gauge: "🎯",
  credit: "📊",
  statement: "🧾",
  seal: "🛡️",
  registry: "🏛️",
  shield: "🔐",
};

export function HelpGlyph({ icon, size = 18 }: { icon: HelpIcon; size?: number }) {
  return <Text style={{ fontSize: size }}>{GLYPH[icon]}</Text>;
}
