// structure.spec.ts: ScoreScreen is a mobile port of creva_finance/frontend/app/score/page.tsx —
// it reads every figure from the real GET /score (score.get()) with loading/error states and
// reuses the shared query primitives, and it carries no hardcoded score anywhere.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/score/ScoreScreen.tsx'), 'utf-8')

describe('ScoreScreen structure', () => {
  it('reads the score from the real api client, never a constant', () => {
    expect(source).toMatch(/from "\.\.\/\.\.\/lib\/api"/)
    expect(source).toMatch(/scoreApi\s*\.?\s*\n?\s*\.get\(\)|scoreApi\.get\(\)/)
  })

  it('has no hardcoded score default (the old `scoreValue = 74`)', () => {
    expect(source).not.toMatch(/scoreValue\s*=\s*\d/)
    expect(source).not.toMatch(/scoreValue\?\s*:\s*number/)
    // the only bare integers allowed are layout/scale constants, never a score value
    const suspicious = Array.from(source.matchAll(/score[A-Za-z]*\s*[=:]\s*(\d+)/g))
    expect(suspicious).toEqual([])
  })

  it('reuses the shared query VisualPrimitives and ScoreGauge instead of duplicating them', () => {
    expect(source).toMatch(/from "\.\.\/query\/components\/VisualPrimitives"/)
    expect(source).toMatch(/from "\.\.\/query\/components\/ScoreGauge"/)
  })

  it('renders distinct loading and error states with stable testIDs', () => {
    expect(source).toMatch(/testID="score-loading"/)
    expect(source).toMatch(/testID="score-error"/)
    expect(source).toMatch(/<ActivityIndicator/)
  })

  it('uses the title from the reference page and keeps the SealPay link, not a repurpose', () => {
    expect(source).toMatch(/Score Creva/)
    expect(source).not.toMatch(/>Tu score</)
    expect(source).toMatch(/testID="score-open-query"/)
  })

  it('wraps the screen in a SafeAreaView with top and bottom edges', () => {
    expect(source).toMatch(/import\s*\{\s*SafeAreaView\s*\}\s*from\s*"react-native-safe-area-context"/)
    expect(source).toMatch(/<SafeAreaView[^>]*edges=\{\["top", "bottom"\]\}/)
  })

  it('offers back and help affordances like the other flow screens', () => {
    expect(source).toMatch(/BackButton/)
    expect(source).toMatch(/testID="score-help"/)
  })
})
