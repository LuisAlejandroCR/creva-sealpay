// help-content.spec.ts: ported from creva_finance/frontend/test/lib. Dropped: the Next.js
// App Router route-existence check (`app/<href>/page.tsx`) — this repo's screens live in
// app/features (Expo, not yet built by another agent) and don't follow that file convention.
import {
  HELP_CATEGORIES,
  MOST_ASKED,
  articleHref,
  categoryHref,
  findArticle,
  findCategory,
  relatedArticles,
  searchHelp,
} from '../../lib/help-content'

const ARTICLES = HELP_CATEGORIES.flatMap(category =>
  category.articles.map(article => ({ category, article })),
)

describe('El índice apunta a pantallas que existen', () => {
  it('toda pregunta se alcanza desde su categoría', () => {
    for (const { category, article } of ARTICLES) {
      expect(findArticle(category.slug, article.slug)?.article).toBe(article)
      expect(articleHref(category.slug, article.slug)).toBe(`${categoryHref(category)}/${article.slug}`)
    }
  })

  it('los cuatro atajos del índice resuelven', () => {
    for (const { category, article } of MOST_ASKED) {
      expect(findArticle(category, article)).toBeDefined()
    }
  })

  it('no repite un slug', () => {
    const categorias = HELP_CATEGORIES.map(category => category.slug)
    expect(new Set(categorias).size).toBe(categorias.length)

    for (const category of HELP_CATEGORIES) {
      const slugs = category.articles.map(article => article.slug)
      expect(new Set(slugs).size).toBe(slugs.length)
    }
  })
})

describe('Ningún artículo escribe una cifra', () => {
  it('deja los números a la API, también cuando explica un límite', () => {
    const conCifra = ARTICLES.filter(({ article }) =>
      /\d/.test([article.question, article.answer, article.note ?? '', ...(article.steps ?? [])].join(' ')),
    ).map(({ category, article }) => `${category.slug}/${article.slug}`)

    expect(conCifra).toEqual([])
  })
})

describe('La búsqueda encuentra lo que la usuaria escribe', () => {
  it('«límite» da la del gasto disponible, aunque el artículo no use esa palabra en el título', () => {
    const slugs = searchHelp('límite').map(hit => hit.article.slug)
    expect(slugs).toContain('cuanto-puedo-gastar')
  })

  it('ignora acentos y mayúsculas', () => {
    expect(searchHelp('CRÉDITO')).toEqual(searchHelp('credito'))
    expect(searchHelp('credito').length).toBeGreaterThan(0)
  })

  it('exige todas las palabras, no cualquiera', () => {
    const dos = searchHelp('borrar cuenta').map(hit => hit.article.slug)
    expect(dos).toContain('borrar-mi-cuenta')
    expect(searchHelp('cuenta').length).toBeGreaterThan(dos.length)
  })

  it('con la caja vacía no devuelve nada', () => {
    expect(searchHelp('')).toEqual([])
    expect(searchHelp('   ')).toEqual([])
  })

  it('sin coincidencia devuelve lista vacía, no todo el índice', () => {
    expect(searchHelp('zzzz')).toEqual([])
  })
})

describe('Un slug desconocido no resuelve', () => {
  it('devuelve undefined en vez de reventar', () => {
    expect(findCategory('no-existe')).toBeUndefined()
    expect(findArticle('score', 'no-existe')).toBeUndefined()
    expect(findArticle('no-existe', 'como-se-calcula')).toBeUndefined()
    expect(relatedArticles('no-existe', 'x')).toEqual([])
  })
})

describe('Las relacionadas', () => {
  it('no incluyen la que se está leyendo', () => {
    const score = findCategory('score')
    const slugs = relatedArticles('score', 'como-se-calcula').map(hit => hit.article.slug)
    expect(slugs).not.toContain('como-se-calcula')
    expect(slugs).toHaveLength((score?.articles.length ?? 0) - 1)
  })
})
