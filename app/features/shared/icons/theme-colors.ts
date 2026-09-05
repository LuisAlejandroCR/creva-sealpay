// theme-colors.ts: re-exports the NativeWind color tokens from ../../../tailwind.config.js as
// plain strings, for the one place that cannot consume a Tailwind className — react-native-svg's
// stroke/fill props. Importing the config (allowJs is already on via expo/tsconfig.base) keeps
// tailwind.config.js the single source of truth instead of a second hardcoded copy of the palette.
import tailwindConfig from "../../../tailwind.config.js";

type ThemeColors = Record<string, string>;

const colors = (tailwindConfig as { theme: { extend: { colors: ThemeColors } } }).theme.extend.colors;

export const themeColors = colors;

export type ThemeColorToken = keyof typeof colors;
