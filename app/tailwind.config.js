// tailwind.config.js: Tailwind content globs and NativeWind preset for the app screens.
/** @type {import('tailwindcss').Config} */
// Colors below are 1:1 hardcoded copies of the light-theme `--cr-*` CSS variables from
// creva_finance/frontend/app/globals.css (NativeWind/RN has no CSS custom properties, so the
// values must be inlined here instead of referenced) — creva_finance is the single source of
// truth for the brand palette; this app supports light mode only, matching light `:root`.
module.exports = {
  content: ["./App.tsx", "./features/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        crimson: "#C41E3A",
        "crimson-dark": "#9E1329",
        rosa: "#FF8FAE",
        inactive: "#DED7C8",

        bg: "#F6F1E7",
        "surface-1": "#FFFFFF",
        "surface-2": "#FFE8EE",

        text: "#1A1613",
        "text-secondary": "#6F675C",
        "text-muted": "rgba(26, 22, 19, 0.72)",
        "text-subtle": "rgba(26, 22, 19, 0.60)",
        border: "rgba(26, 22, 19, 0.10)",

        success: "#2E6A48",
        "success-bg": "rgba(46, 106, 72, 0.15)",
        "success-border": "rgba(46, 106, 72, 0.30)",
        "success-text": "#2E6A48",

        danger: "#C41E3A",
        "danger-bg": "rgba(196, 30, 58, 0.12)",
        "danger-border": "rgba(196, 30, 58, 0.25)",
        "danger-text": "#C41E3A",

        warning: "#E8A020",
        "warning-bg": "rgba(232, 160, 32, 0.10)",
        "warning-border": "rgba(232, 160, 32, 0.20)",
        "warning-text": "#8A5A00",

        info: "#3A5FD8",
        "info-bg": "rgba(58, 95, 216, 0.10)",
        "info-border": "rgba(58, 95, 216, 0.20)",
        "info-text": "#3A5FD8",
      },
    },
  },
  plugins: [],
};
