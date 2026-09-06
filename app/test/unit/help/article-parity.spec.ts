// article-parity.spec.ts: HelpArticleScreen must carry every section the web reference has
// (help/[category]/[article]/page.tsx) — lead answer, "Cómo se hace" steps, "Ten en cuenta"
// caveat, the resolvedBy CTA, "Otras de este tema", and the privacy-contact footer.
import { readFileSync } from 'fs'
import { join } from 'path'

const screen = readFileSync(join(__dirname, '../../../features/help/HelpArticleScreen.tsx'), 'utf-8')
const app = readFileSync(join(__dirname, '../../../App.tsx'), 'utf-8')

describe('HelpArticleScreen parity with the web reference', () => {
  it('scrolls, so a long article is not clipped', () => {
    expect(screen).toMatch(/<ScrollView/)
    expect(screen).not.toMatch(/<View className="px-6 pb-10 pt-6">\s*<BackButton/)
  })

  it('renders every reference section, each gated on its article field', () => {
    expect(screen).toContain('{article.answer}')
    expect(screen).toMatch(/article\.steps \?/)
    expect(screen).toContain('Cómo se hace')
    expect(screen).toMatch(/article\.note \?/)
    expect(screen).toContain('Ten en cuenta')
    expect(screen).toMatch(/article\.resolvedBy \?/)
    expect(screen).toContain('help-article-resolve-cta')
    expect(screen).toMatch(/relatedArticles\(category\.slug, article\.slug\)/)
    expect(screen).toContain('Otras de este tema')
    expect(screen).toContain('privacidad@finarahub.mx')
  })

  it('the resolvedBy CTA and related rows navigate through App.tsx, never dead-end', () => {
    expect(screen).toMatch(/onResolve\(article\.resolvedBy\.href\)/)
    expect(screen).toMatch(/onOpenArticle\(other\)/)
    expect(app).toMatch(/function openHelpResolve\(href: string\)/)
    expect(app).toMatch(/onResolve=\{openHelpResolve\}/)
    // every resolvedBy href a help article can produce must be routable
    for (const href of [
      '/login',
      '/credit',
      '/score',
      '/cards',
      '/collateral',
      '/statements',
      '/movements',
      '/report',
      '/business-verification',
      '/regulatory',
      '/profile/security',
      '/profile/details',
      '/profile/delete-account',
      '/privacy',
    ]) {
      expect(app).toContain(`"${href}"`)
    }
  })
})
