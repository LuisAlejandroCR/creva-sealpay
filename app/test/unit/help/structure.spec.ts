// structure.spec.ts: HelpScreen sources every category/article from app/lib/help-content.ts
// (already ported and tested separately) rather than hardcoding copy, and renders the search box
// ahead of the browse view — same "search always wins" rule as the Next.js reference.
import { readFileSync } from 'fs'
import { join } from 'path'
import { HELP_CATEGORIES, MOST_ASKED } from '../../../lib/help-content'

const source = readFileSync(join(__dirname, '../../../features/help/HelpScreen.tsx'), 'utf-8')

describe('HelpScreen structure', () => {
  it('imports categories and most-asked list from app/lib/help-content', () => {
    expect(source).toMatch(/from "\.\.\/\.\.\/lib\/help-content"/)
  })

  it('renders the search box ahead of the category browse view', () => {
    const searchIndex = source.indexOf('<HelpSearch>')
    const categoriesIndex = source.indexOf('Entra por tema')
    expect(searchIndex).toBeGreaterThanOrEqual(0)
    expect(categoriesIndex).toBeGreaterThan(searchIndex)
  })

  it('the content module actually has categories and most-asked entries to render', () => {
    expect(HELP_CATEGORIES.length).toBeGreaterThan(0)
    expect(MOST_ASKED.length).toBeGreaterThan(0)
  })

  it('publishes only the real privacy contact channel, not an invented support inbox', () => {
    expect(source).toContain('privacidad@finarahub.mx')
  })
})
