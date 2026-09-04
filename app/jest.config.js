// jest.config.js: runs test/{unit,fuzz,invariant}/**/*.spec.ts with ts-jest, no RN renderer
// needed — every ported/added suite here exercises pure TypeScript, never a component.
// TZ is set here, not in a test file: workers inherit it at spawn, and an assignment inside a
// test arrives after the timezone is already resolved.
process.env.TZ = 'America/Mexico_City'

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/test/unit/**/*.spec.ts', '**/test/fuzz/**/*.fuzz.spec.ts', '**/test/invariant/**/*.invariant.spec.ts'],
}
