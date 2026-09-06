// format-percent.spec.ts: ported unmodified from creva_finance/frontend/test/lib — shares of one
// whole are rounded together, not one by one.
import { formatPercent, formatShare, splitPercent } from '../../lib/format-percent'

describe('Un porcentaje que va solo', () => {
  it('escribe la razón como porcentaje entero', () => {
    expect(formatPercent(0.12)).toBe('12%')
    expect(formatPercent('0.4321')).toBe('43%')
    expect(formatPercent(1)).toBe('100%')
  })

  it('escribe vacío lo que no existe, y deja el rótulo a la pantalla', () => {
    expect(formatPercent(null)).toBe('')
    expect(formatPercent(undefined)).toBe('')
    expect(formatPercent('')).toBe('')
    expect(formatPercent('no es una razón')).toBe('')
  })
})

describe('Las porciones de un mismo total', () => {
  it('cierran en 100 en el caso que dio nombre al bloque', () => {
    const [income, expenses] = splitPercent([5050, 4950])
    expect(income + expenses).toBe(100)
    expect([income, expenses]).toEqual([51, 49])
  })

  it('cierran en 100 con tres porciones iguales, donde cada una pierde un tercio', () => {
    const shares = splitPercent([1000, 1000, 1000])
    expect(shares.reduce((sum, share) => sum + share, 0)).toBe(100)
    expect(shares).toEqual([34, 33, 33])
  })

  it('deja intacto el reparto que ya caía redondo', () => {
    expect(splitPercent([3000, 1500, 5500])).toEqual([30, 15, 55])
  })

  it('no reparte nada cuando no hay total que repartir', () => {
    expect(splitPercent([0, 0])).toEqual([0, 0])
    expect(splitPercent([Number.NaN, 5])).toEqual([0, 100])
  })

  it('escribe la porción con su signo, que ninguna pantalla pone a mano', () => {
    expect(formatShare(51)).toBe('51%')
  })
})
