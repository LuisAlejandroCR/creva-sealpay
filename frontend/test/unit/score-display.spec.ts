// score-display.spec.ts: ported from creva_finance/frontend/test/lib. The "no cut-off" scan
// reads this same ported file (lib/score-display.ts) rather than the original repo's path.
import { readFileSync } from 'fs'
import { join } from 'path'
import { factorLabel, factorHint, factorLever, scoreBand, scoreArcPath } from '../../lib/score-display'

describe('scoreBand', () => {
  it('paints the band the API sent, in es-MX', () => {
    expect(scoreBand('excellent')?.label).toBe('Excelente')
    expect(scoreBand('good')?.label).toBe('Bueno')
    expect(scoreBand('fair')?.label).toBe('Regular')
    expect(scoreBand('poor')?.label).toBe('Por mejorar')
  })

  it('says nothing when the API sent no band', () => {
    expect(scoreBand(null)).toBeNull()
    expect(scoreBand(undefined)).toBeNull()
  })

  it('every band carries a word as well as a colour', () => {
    for (const key of ['excellent', 'good', 'fair', 'poor'] as const) {
      const band = scoreBand(key)
      expect(band).toHaveProperty('label')
      expect(band).toHaveProperty('color')
      expect(band).toHaveProperty('bg')
    }
  })

  it('holds no cut-off: the only number it compares against is zero', () => {
    const source = readFileSync(join(__dirname, '../../lib/score-display.ts'), 'utf8')
    const comparados = Array.from(source.matchAll(/[<>]=?\s*([\d.]+)/g)).map(match => match[1])
    expect(comparados.filter(value => value !== '0')).toEqual([])
  })
})

describe('factorLabel', () => {
  it('returns a label for known factor keys', () => {
    const names = ['consistency_score', 'business_ratio_score', 'collateral_usage_score', 'category_diversity_score']
    for (const name of names) {
      expect(factorLabel(name)).toBeTruthy()
    }
  })

  it('returns the raw name as fallback for unknown keys', () => {
    expect(factorLabel('nonexistent_key')).toBe('nonexistent_key')
  })

  it('handles bare keys without _score suffix', () => {
    expect(factorLabel('consistency')).toBeTruthy()
  })
})

describe('factorHint', () => {
  it('returns a string for every known factor', () => {
    const names = ['consistency_score', 'business_ratio_score', 'collateral_usage_score', 'category_diversity_score']
    for (const name of names) {
      const hint = factorHint(name)
      expect(typeof hint).toBe('string')
      expect(hint.length).toBeGreaterThan(0)
    }
  })
})

describe('scoreArcPath', () => {
  it('returns an SVG path string', () => {
    const path = scoreArcPath(50, 100)
    expect(typeof path).toBe('string')
    expect(path.startsWith('M')).toBe(true)
  })

  it('draws over the scale it is given, not over 100', () => {
    expect(scoreArcPath(45, 90)).toBe(scoreArcPath(50, 100))
    expect(scoreArcPath(90, 90)).toBe(scoreArcPath(100, 100))
  })

  it('clamps to its own ends, and refuses a scale of zero', () => {
    expect(scoreArcPath(-10, 90)).toBe(scoreArcPath(0, 90))
    expect(scoreArcPath(200, 90)).toBe(scoreArcPath(90, 90))
    expect(scoreArcPath(10, 0)).toBe('')
  })
})

const FACTORS = ['consistency', 'business_ratio', 'collateral_usage', 'category_diversity']

describe('factorLever', () => {
  it('tells every factor what would move it, with or without the _score suffix', () => {
    for (const factor of FACTORS) {
      expect(factorLever(`${factor}_score`).length).toBeGreaterThan(0)
      expect(factorLever(factor)).toBe(factorLever(`${factor}_score`))
    }
  })

  it('never states a figure', () => {
    for (const factor of FACTORS) {
      expect(factorLever(`${factor}_score`)).not.toMatch(/[0-9]/)
    }
  })

  it('says nothing for a factor it does not know', () => {
    expect(factorLever('unknown_factor')).toBe('')
  })
})
