// tailwind.config.js: Tailwind content globs and NativeWind preset for the app screens.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./features/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
