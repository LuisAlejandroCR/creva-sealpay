// safe-area.spec.ts: guards against the status-bar-overlap regression seen in Expo Go on a
// physical iPhone — VerifyScreen's "Comprobar un reporte" header and the loading state must both
// render inside a SafeAreaView with a 'top' edge, not a bare View/ScrollView.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/verify/VerifyScreen.tsx'), 'utf-8')

describe('VerifyScreen safe-area insets', () => {
  it('imports SafeAreaView from react-native-safe-area-context', () => {
    expect(source).toMatch(
      /import\s*\{\s*SafeAreaView\s*\}\s*from\s*"react-native-safe-area-context"/,
    )
  })

  it('wraps both the loading state and the loaded report in SafeAreaView with a top edge', () => {
    const safeAreaViewTags = source.match(/<SafeAreaView[^>]*>/g) ?? []
    expect(safeAreaViewTags.length).toBe(2)

    for (const tag of safeAreaViewTags) {
      expect(tag).toMatch(/edges=\{\["top", "bottom"\]\}/)
    }
  })

  it('does not rely on a fixed pt-12 guess for status-bar clearance anymore', () => {
    expect(source).not.toMatch(/contentContainerClassName="px-6 pb-10 pt-12"/)
  })
})
