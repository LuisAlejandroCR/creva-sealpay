// safe-area.spec.ts: DashboardScreen must clear the OS status bar the same way
// QueryScreen/VerifyScreen/SelfieCheckScreen already do (regression seen on a physical iPhone
// in Expo Go) — SafeAreaView with a top edge wrapping the scrollable content.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/dashboard/DashboardScreen.tsx'), 'utf-8')

describe('DashboardScreen safe-area insets', () => {
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
