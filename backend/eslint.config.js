// eslint.config.js: flat ESLint config for the gateway package, TypeScript rules only.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // dist/ is build output. The .mjs files under test/integration are manual runners that import
    // from dist/ and run outside vitest (like the live-* specs) — not part of the typed lint pass.
    ignores: ["dist/**", "test/integration/**/*.mjs"],
  },
);
