// jest.config.js: single Jest config for the whole app — merged from feature-logic-port's
// standalone ts-jest config (which only ran test/{unit,fuzz,invariant}/**/*.spec.ts) and
// feature-selfie-check/feature-agent-loop's inline package.json "jest": {"preset": "jest-expo"}
// (needed for RN component tests). jest-expo's babel transform compiles plain .spec.ts files
// fine, so one preset covers both; a package.json "jest" key can't coexist with this file, so
// it was removed there in the same merge (Jest errors on "multiple configurations found").
// TZ is set here, not in a test file: workers inherit it at spawn, and an assignment inside a
// test arrives after the timezone is already resolved.
process.env.TZ = 'America/Mexico_City'

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/test/unit/**/*.spec.ts',
    '**/test/fuzz/**/*.fuzz.spec.ts',
    '**/test/invariant/**/*.invariant.spec.ts',
  ],
}
