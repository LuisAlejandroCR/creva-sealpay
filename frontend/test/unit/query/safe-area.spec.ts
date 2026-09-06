// safe-area.spec.ts: guards against the status-bar-overlap regression seen in Expo Go on a
// physical iPhone — QueryScreen's header ("Consulta pagada") and section titles ("Pago
// requerido") must render inside a SafeAreaView with a 'top' edge, not a bare ScrollView.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/query/QueryScreen.tsx'), 'utf-8')

describe('QueryScreen safe-area insets', () => {
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

  it('does not rely on a fixed pt-12 guess for status-bar clearance anymore', () => {
    expect(source).not.toMatch(/contentContainerClassName="px-6 pb-10 pt-12"/)
  })
})
