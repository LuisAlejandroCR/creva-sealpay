// safe-area.spec.ts: guards against the status-bar-overlap regression seen in Expo Go on a
// physical iPhone — every SelfieCheckScreen state branch must wrap its content in SafeAreaView
// with a 'top' edge instead of a plain View, and App.tsx must provide SafeAreaProvider.
import { readFileSync } from 'fs'
import { join } from 'path'

const screenSource = readFileSync(
  join(__dirname, '../../../features/onboarding/SelfieCheckScreen.tsx'),
  'utf-8',
)
const appSource = readFileSync(join(__dirname, '../../../App.tsx'), 'utf-8')

describe('SelfieCheckScreen safe-area insets', () => {
  it('imports SafeAreaView from react-native-safe-area-context', () => {
    expect(screenSource).toMatch(
      /import\s*\{\s*SafeAreaView\s*\}\s*from\s*['"]react-native-safe-area-context['"]/,
    )
  })

  it('wraps every returned root container in SafeAreaView', () => {
    const returnBlocks = screenSource.match(/return\s*\(([\s\S]*?)\n {2}\)/g) ?? []
    expect(returnBlocks.length).toBeGreaterThan(0)

    for (const block of returnBlocks) {
      expect(block).toMatch(/<SafeAreaView\b/)
    }
  })

  it('includes the top edge so header content clears the OS status bar', () => {
    const safeAreaViewTags = screenSource.match(/<SafeAreaView[^>]*>/g) ?? []
    expect(safeAreaViewTags.length).toBeGreaterThan(0)

    for (const tag of safeAreaViewTags) {
      expect(tag).toMatch(/edges=\{\[[^\]]*['"]top['"][^\]]*\]\}/)
    }
  })

  it('no longer uses a bare top-level View for a state branch', () => {
    expect(screenSource).not.toMatch(/return\s*\(\s*<View className="flex-1/)
  })
})

describe('App root safe-area setup', () => {
  it('wraps the app in SafeAreaProvider', () => {
    expect(appSource).toMatch(
      /import\s*\{\s*SafeAreaProvider\s*\}\s*from\s*['"]react-native-safe-area-context['"]/,
    )
    expect(appSource).toMatch(/<SafeAreaProvider>/)
  })
})
