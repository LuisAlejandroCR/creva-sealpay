// SignInScreen.spec.ts: SignInScreen is real sign-in construction (not a 1:1 visual port, per
// AGENTS.md task scope), so this checks it actually wires Clerk's useSignIn/useSignUp/useSSO
// hooks instead of faking a working form, and that it never touches ClerkAppProvider.tsx.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/auth/SignInScreen.tsx'), 'utf-8')

describe('SignInScreen Clerk wiring', () => {
  it('imports useSignIn, useSignUp and useSSO from @clerk/clerk-expo', () => {
    expect(source).toMatch(/import\s*\{\s*useSignIn,\s*useSignUp,\s*useSSO\s*\}\s*from\s*"@clerk\/clerk-expo"/)
  })

  it('calls signIn.create and signUp.create rather than mocking the result', () => {
    expect(source).toMatch(/signIn\.create\(/)
    expect(source).toMatch(/signUp\.create\(/)
  })

  it('activates the session via setActive after a complete attempt', () => {
    expect(source).toMatch(/setActiveSignIn\(\{ session: attempt\.createdSessionId \}\)/)
    expect(source).toMatch(/setActiveSignUp\(\{ session: attempt\.createdSessionId \}\)/)
  })

  it('never imports or renders a ClerkProvider — consumes the existing context only', () => {
    expect(source).not.toMatch(/import[^\n]*ClerkAppProvider/)
    expect(source).not.toMatch(/<ClerkProvider/)
  })

  it('surfaces Clerk errors to the user instead of swallowing them', () => {
    expect(source).toMatch(/testID="auth-error"/)
    expect(source).toMatch(/catch \(err\)/)
  })

  it('lets the user switch between sign-in and sign-up', () => {
    expect(source).toMatch(/testID="auth-switch-mode"/)
    expect(source).toMatch(/setMode\(isSignIn \? "sign-up" : "sign-in"\)/)
  })
})
