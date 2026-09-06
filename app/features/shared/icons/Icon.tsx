// Icon.tsx: shared hand-drawn line-art icon set for app/features/**, replacing every emoji glyph
// found by the UI audit. Every path is copied exactly (viewBox, d, stroke/fill approach) from a
// specific creva_finance/frontend source line — see the per-case comment for its file:line citation
// — and adapted from web <svg> to react-native-svg. Colors resolve through theme-colors.ts
// (tailwind.config.js), never a literal hex. Full citation table: docs/plan.md, icon audit block.
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { themeColors, type ThemeColorToken } from "./theme-colors";

export type IconName =
  | "home"
  | "score"
  | "card"
  | "credit"
  | "more"
  | "bell"
  | "profile"
  | "statement"
  | "fiscal"
  | "security"
  | "shield"
  | "key"
  | "seal"
  | "registry"
  | "report"
  | "back-chevron"
  | "eye"
  | "eye-off"
  | "search"
  | "close"
  | "movements"
  | "calculator"
  | "collateral"
  | "privacy"
  | "help"
  | "logout"
  | "chevron-right"
  | "financing";

export interface IconProps {
  name: IconName;
  size?: number;
  /** A theme token from tailwind.config.js's `colors` map, e.g. "text", "text-secondary",
   *  "crimson" — or the literal "white" for a glyph on a brand (crimson) surface. */
  color?: ThemeColorToken | "white";
  /** Fills the glyph instead of only stroking it — used for the active tab state. */
  filled?: boolean;
}

function resolveColor(token: ThemeColorToken | "white" | undefined, fallback: ThemeColorToken): string {
  if (token === "white") return "#FFFFFF";
  return themeColors[token ?? fallback] ?? themeColors[fallback];
}

export function Icon({ name, size = 22, color, filled = false }: IconProps) {
  const stroke = resolveColor(color, "text-secondary");
  const fillColor = filled ? stroke : "none";
  // fill="none" mirrors the web sources' root <svg fill="none"> (e.g. BottomNav.tsx:25,40,51):
  // react-native-svg otherwise defaults every <Path>/<Rect> to fill="black". Shapes meant to be
  // filled still override with their own fill={stroke}/fill={fillColor}.
  const common = { viewBox: "0 0 24 24", fill: "none" } as const;

  switch (name) {
    case "home":
      return (
        <Svg width={size} height={size} {...common}>
          <Path
            d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"
            fill={fillColor}
            stroke={stroke}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "score":
      return (
        <Svg width={size} height={size} {...common}>
          <Path d="M3 15a9 9 0 0 1 18 0" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M12 15l4.5-4" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
          <Circle cx={12} cy={15} r={1.8} fill={stroke} />
        </Svg>
      );
    case "card":
      return (
        <Svg width={size} height={size} {...common}>
          <Rect x={2} y={5} width={20} height={14} rx={3} stroke={stroke} strokeWidth={1.8} />
          <Path d="M2 10h20" stroke={stroke} strokeWidth={1.8} />
          <Rect x={5} y={13} width={4} height={2} rx={1} fill={stroke} />
        </Svg>
      );
    case "credit":
      return (
        <Svg width={size} height={size} {...common}>
          <Path
            d="M4 19V9M10 19V5M16 19v-7M22 19H2"
            stroke={stroke}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      );
    case "more":
      return (
        <Svg width={size} height={size} {...common}>
          <Circle cx={5} cy={12} r={1.9} fill={stroke} />
          <Circle cx={12} cy={12} r={1.9} fill={stroke} />
          <Circle cx={19} cy={12} r={1.9} fill={stroke} />
        </Svg>
      );
    case "bell":
      return (
        <Svg width={size} height={size} {...common}>
          <Path
            d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5M13.7 20a2 2 0 0 1-3.4 0"
            stroke={stroke}
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "profile":
      return (
        <Svg width={size} height={size} {...common}>
          <Circle cx={12} cy={8} r={4} stroke={stroke} strokeWidth={1.7} />
          <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );
    case "statement":
      return (
        <Svg width={size} height={size} {...common}>
          <Path
            d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"
            stroke={stroke}
            strokeWidth={1.7}
          />
          <Path d="M14 3v5h5M8.5 13h7M8.5 17h4" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );
    case "fiscal":
      // creva_finance/frontend/app/profile/page.tsx:36-39 ("Información fiscal" row) — a plain
      // folded-corner document, distinct from the lined "statement" glyph above.
      return (
        <Svg width={size} height={size} {...common}>
          <Path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            stroke={stroke}
            strokeWidth={1.8}
          />
          <Path d="M14 2v6h6" stroke={stroke} strokeWidth={1.8} />
        </Svg>
      );
    case "movements":
      // creva_finance/frontend/components/BottomNav.tsx:87 (NAV_GLYPHS['/movements']) — swap
      // arrows, not the document glyph "statement" used to share.
      return (
        <Svg width={size} height={size} {...common}>
          <Path
            d="M4 8h13m0 0-3-3m3 3-3 3M20 16H7m0 0 3-3m-3 3 3 3"
            stroke={stroke}
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "report":
      // creva_finance/frontend/components/BottomNav.tsx:93 (NAV_GLYPHS['/report']) — the same
      // document outline as "statement" but with a magnifying/summary circle instead of ruled lines.
      return (
        <Svg width={size} height={size} {...common}>
          <Path
            d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"
            stroke={stroke}
            strokeWidth={1.7}
          />
          <Path d="M14 3v5h5" stroke={stroke} strokeWidth={1.7} />
          <Circle cx={12} cy={14.5} r={3} stroke={stroke} strokeWidth={1.7} />
        </Svg>
      );
    case "security":
      // creva_finance/frontend/app/profile/page.tsx:43-49 ("Seguridad" row) — a plain shield
      // outline, distinct from both "shield" (collateral checkmark-shield) and "privacy" (padlock).
      return (
        <Svg width={size} height={size} {...common}>
          <Path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            fill={fillColor}
            stroke={stroke}
            strokeWidth={1.8}
          />
        </Svg>
      );
    case "shield":
      // creva_finance/frontend/components/help/HelpGlyph.tsx:49-54 ("shield" HelpIcon) — the
      // checkmark shield, same glyph as "collateral" below (BottomNav.tsx:90).
      return (
        <Svg width={size} height={size} {...common}>
          <Path
            d="M12 2.5 4.5 5.5V11c0 5.2 3.2 8.8 7.5 10 4.3-1.2 7.5-4.8 7.5-10V5.5z"
            fill={fillColor}
            stroke={stroke}
            strokeWidth={1.7}
            strokeLinejoin="round"
          />
          <Path d="m9 12 2 2 4-4" stroke={filled ? "none" : stroke} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "privacy":
      // creva_finance/frontend/components/BottomNav.tsx:97 (NAV_GLYPHS['/privacy']) — the
      // padlock-on-rect glyph. Kept as its own case, separate from "shield" above.
      return (
        <Svg width={size} height={size} {...common}>
          <Rect x={4.5} y={10.5} width={15} height={10} rx={2.5} stroke={stroke} strokeWidth={1.7} />
          <Path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke={stroke} strokeWidth={1.7} />
        </Svg>
      );
    case "key":
      return (
        <Svg width={size} height={size} {...common}>
          <Circle cx={8} cy={8} r={4.5} stroke={stroke} strokeWidth={1.7} />
          <Path
            d="M11.5 11.5 20 20M17 20l3-3M14.5 14.5l2.5 2.5"
            stroke={stroke}
            strokeWidth={1.7}
            strokeLinecap="round"
          />
        </Svg>
      );
    case "seal":
      return (
        <Svg width={size} height={size} {...common}>
          <Circle cx={12} cy={9.5} r={5.5} stroke={stroke} strokeWidth={1.7} />
          <Path d="m8.5 14.5-1 7 4.5-2.5 4.5 2.5-1-7" stroke={stroke} strokeWidth={1.7} strokeLinejoin="round" />
        </Svg>
      );
    case "registry":
      return (
        <Svg width={size} height={size} {...common}>
          <Path d="M3 21h18M5 21V9.5l7-5 7 5V21" stroke={stroke} strokeWidth={1.7} strokeLinejoin="round" />
          <Path d="M10 21v-5h4v5" stroke={stroke} strokeWidth={1.7} strokeLinejoin="round" />
        </Svg>
      );
    case "back-chevron":
      return (
        <Svg width={size} height={size} {...common}>
          <Path
            d="M19 12H5M12 19l-7-7 7-7"
            stroke={stroke}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "eye":
      // creva_finance/frontend/components/auth/PasswordField.tsx:46-47 (shown === false branch).
      return (
        <Svg width={size} height={size} {...common}>
          <Path
            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
            stroke={stroke}
            strokeWidth={1.8}
          />
          <Circle cx={12} cy={12} r={3} stroke={stroke} strokeWidth={1.8} />
        </Svg>
      );
    case "eye-off":
      // creva_finance/frontend/components/auth/PasswordField.tsx:43 (shown === true branch).
      return (
        <Svg width={size} height={size} {...common}>
          <Path
            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"
            stroke={stroke}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      );
    case "search":
      // creva_finance/frontend/components/help/HelpSearch.tsx:31-32.
      return (
        <Svg width={size} height={size} {...common}>
          <Circle cx={11} cy={11} r={6.5} stroke={stroke} strokeWidth={1.8} />
          <Path d="m16 16 4.5 4.5" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case "close":
      // creva_finance/frontend/components/help/HelpSearch.tsx:67 (search field's clear button).
      return (
        <Svg width={size} height={size} {...common}>
          <Path d="M6 6l12 12M18 6L6 18" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case "calculator":
      return (
        <Svg width={size} height={size} {...common}>
          <Rect x={5} y={3} width={14} height={18} rx={2.5} stroke={stroke} strokeWidth={1.7} />
          <Path
            d="M8.5 8h7M9 12.5h.01M12 12.5h.01M15 12.5h.01M9 16.5h.01M12 16.5h.01M15 16.5h.01"
            stroke={stroke}
            strokeWidth={1.9}
            strokeLinecap="round"
          />
        </Svg>
      );
    case "help":
      return (
        <Svg width={size} height={size} {...common}>
          <Circle cx={12} cy={12} r={9} stroke={stroke} strokeWidth={1.7} />
          <Path d="M9.6 9.4a2.5 2.5 0 0 1 4.9.6c0 1.7-2.5 2-2.5 3.5" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" />
          <Circle cx={12} cy={17} r={1.05} fill={stroke} />
        </Svg>
      );
    case "logout":
      return (
        <Svg width={size} height={size} {...common}>
          <Path
            d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
            stroke={stroke}
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "collateral":
      return (
        <Svg width={size} height={size} {...common}>
          <Path
            d="M12 2.5 4.5 5.5V11c0 5.2 3.2 8.8 7.5 10 4.3-1.2 7.5-4.8 7.5-10V5.5z"
            stroke={stroke}
            strokeWidth={1.7}
            strokeLinejoin="round"
          />
          <Path d="m9 12 2 2 4-4" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "chevron-right":
      // creva_finance/frontend/components/ui/ActionCard.tsx chevron (d="M9 6l6 6-6 6", width 2).
      return (
        <Svg width={size} height={size} {...common}>
          <Path d="M9 6l6 6-6 6" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "financing":
      // creva_finance/frontend/app/dashboard/page.tsx:236-240 (financing ActionCard icon).
      return (
        <Svg width={size} height={size} {...common}>
          <Rect x={3} y={6} width={18} height={13} rx={2.5} stroke={stroke} strokeWidth={1.8} />
          <Path d="M3 10.5h18" stroke={stroke} strokeWidth={1.8} />
          <Path d="M6.5 15h4" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}
