// safe-area.spec.ts: SignInScreen must clear the OS status bar, same convention as the other
// screens in this worktree — SafeAreaView with a top edge wrapping the scrollable content.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/auth/SignInScreen.tsx'), 'utf-8')

describe('SignInScreen safe-area insets', () => {
  it('imports SafeAreaView from react-native-safe-area-context', () => {
    expect(source).toMatch(
      /import\s*\{\s*SafeAreaView\s*\}\s*from\s*"react-native-safe-area-context"/,
    )
  })

  it('wraps the ScrollView in a SafeAreaView with a top edge', () => {
    const match = source.match(/<SafeAreaView[^>]*>/)
    expect(match).not.toBeNull()
    expect(match?.[0]).toMatch(/edges=\{\["top", "bottom"\]\}/)

    const safeAreaViewIndex = source.indexOf('<SafeAreaView')
    const scrollViewIndex = source.indexOf('<ScrollView')
    expect(safeAreaViewIndex).toBeGreaterThanOrEqual(0)
    expect(scrollViewIndex).toBeGreaterThan(safeAreaViewIndex)
  })
})
