// index-and-category-parity.spec.ts: HelpScreen (index) and HelpCategoryScreen must match the web
// layout — four most-asked tiles across, a surface-2 icon badge on each theme row, the answer used
// as the row description, and the whole-index search box above a scrolling category list.
import { readFileSync } from 'fs'
import { join } from 'path'

const index = readFileSync(join(__dirname, '../../../features/help/HelpScreen.tsx'), 'utf-8')
const category = readFileSync(join(__dirname, '../../../features/help/HelpCategoryScreen.tsx'), 'utf-8')

describe('HelpScreen index parity', () => {
  it('lays the most-asked tiles four across (flex-1), not a two-column wrap', () => {
    expect(index).toMatch(/<View className="flex-row gap-2">/)
    expect(index).toMatch(/className="flex-1 items-center[^"]*"/)
    expect(index).not.toMatch(/w-\[47%\]/)
  })

  it('wraps each theme glyph in the surface-2 icon badge from MenuRow', () => {
    expect(index).toMatch(/h-\[38px\] w-\[38px\][^"]*rounded-xl bg-surface-2/)
  })
})

describe('HelpCategoryScreen parity', () => {
  it('scrolls and puts the whole-index search above the list', () => {
    expect(category).toMatch(/<ScrollView/)
    const searchIndex = category.indexOf('<HelpSearch')
    const listIndex = category.indexOf('category.articles.map')
    expect(searchIndex).toBeGreaterThanOrEqual(0)
    expect(listIndex).toBeGreaterThan(searchIndex)
  })

  it('shows each question with its one-line answer as the description', () => {
    expect(category).toContain('{article.question}')
    expect(category).toContain('{article.answer}')
  })

  it('routes every row through the shared href handler, never a dead end', () => {
    expect(category).toMatch(/onOpenArticle\(articleHref\(category\.slug, article\.slug\)\)/)
  })
})
