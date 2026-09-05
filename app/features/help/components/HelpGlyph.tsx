// HelpGlyph.tsx: mobile equivalent of creva_finance's components/help/HelpGlyph.tsx — draws
// from the shared SVG icon set instead of an emoji map, keeping the same HelpIcon-key-to-glyph
// mapping (key, card, gauge, credit, statement, seal, registry, shield) the content module expects.
import type { HelpIcon } from "../../../lib/help-content";
import { Icon, type IconName } from "../../shared/icons/Icon";

const ICON_FOR_HELP: Record<HelpIcon, IconName> = {
  key: "key",
  card: "card",
  gauge: "score",
  credit: "credit",
  statement: "statement",
  seal: "seal",
  registry: "registry",
  shield: "shield",
};

export function HelpGlyph({ icon, size = 18 }: { icon: HelpIcon; size?: number }) {
  return <Icon name={ICON_FOR_HELP[icon]} size={size} color="text-secondary" />;
}
