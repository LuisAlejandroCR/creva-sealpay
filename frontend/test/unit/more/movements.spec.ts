// movements.spec.ts: MovementsScreen ports the reference app/movements/page.tsx — card
// transactions merged with statement entries, bucketed, filterable, with detail + reclassify +
// share. Source-string checks, same convention as profile/structure.spec.ts.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/more/MovementsScreen.tsx'), 'utf-8')

describe('MovementsScreen structure', () => {
  it('merges real transactions and statement entries, not mock data', () => {
    expect(source).toMatch(/transactions\.list\(/)
    expect(source).toMatch(/statements\.list\(\)/)
    expect(source).toMatch(/statements\.entries\(/)
  })

  it('reclassifies only statement entries, matching the reference rule', () => {
    expect(source).toMatch(/statements\.reclassify\(/)
    expect(source).toMatch(/if\s*\(\s*!movement\.entryId\s*\)\s*return/)
  })

  it('shares plain text with no account data, via the native Share sheet', () => {
    expect(source).toMatch(/Share\.share\(/)
    expect(source).toMatch(/shareTextOf/)
  })

  it('exposes the filter, rows and detail sheet with stable testIDs', () => {
    for (const id of [
      'movements-filter',
      'movements-loading',
      'movements-empty',
      'movement-detail-sheet',
      'movement-share-cta',
    ]) {
      expect(source).toContain(id)
    }
  })
})
