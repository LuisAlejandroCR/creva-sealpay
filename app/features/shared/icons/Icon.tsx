// Icon.tsx: shared hand-drawn line-art icon set for app/features/**, replacing every emoji glyph
// found by the UI audit. Path data is copied from creva_finance/frontend/components/BottomNav.tsx
// and components/help/HelpGlyph.tsx (the visual source of truth) and adapted from web <svg> to
// react-native-svg. Colors resolve through theme-colors.ts (tailwind.config.js), never a literal hex.
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
  | "shield"
  | "key"
  | "seal"
  | "registry"
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
  | "logout";

export interface IconProps {
  name: IconName;
  size?: number;
  /** A theme token from tailwind.config.js's `colors` map, e.g. "text", "text-secondary", "crimson". */
  color?: ThemeColorToken;
  /** Fills the glyph instead of only stroking it — used for the active tab state. */
  filled?: boolean;
}

function resolveColor(token: ThemeColorToken | undefined, fallback: ThemeColorToken): string {
  return themeColors[token ?? fallback] ?? themeColors[fallback];
}

export function Icon({ name, size = 22, color, filled = false }: IconProps) {
  const stroke = resolveColor(color, "text-secondary");
  const fillColor = filled ? stroke : "none";
  const common = { viewBox: "0 0 24 24" as const };

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
    case "movements": // shares the document glyph — see docs/plan.md icon-set notes
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
    case "shield":
    case "privacy": // creva_finance's /privacy row reuses the shield lock glyph too
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
      return (
        <Svg width={size} height={size} {...common}>
          <Path
            d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"
            stroke={stroke}
            strokeWidth={1.7}
            strokeLinejoin="round"
          />
          <Circle cx={12} cy={12} r={2.6} stroke={stroke} strokeWidth={1.7} />
        </Svg>
      );
    case "eye-off":
      return (
        <Svg width={size} height={size} {...common}>
          <Path
            d="M3.5 3.5l17 17M6.6 6.9C4.2 8.4 2 12 2 12s3.6 7 10 7c1.8 0 3.3-.5 4.6-1.2M9.9 9.9a2.6 2.6 0 0 0 3.7 3.7M10.6 5.2A9.9 9.9 0 0 1 12 5c6.4 0 10 7 10 7a15.6 15.6 0 0 1-2.3 3.3"
            stroke={stroke}
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "search":
      return (
        <Svg width={size} height={size} {...common}>
          <Circle cx={10.5} cy={10.5} r={6.5} stroke={stroke} strokeWidth={1.7} />
          <Path d="m20 20-4.3-4.3" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );
    case "close":
      return (
        <Svg width={size} height={size} {...common}>
          <Path d="M5 5l14 14M19 5 5 19" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" />
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
    default:
      return null;
  }
}
