// format-money.spec.ts: ported from creva_finance/frontend/test/lib — an amount is written with
// the precision it actually has. The cross-repo "no screen writes its own formatter" scan was
// dropped: app/features (screens) does not exist yet in this repo, so it has nothing to scan.
import { amountTone, formatMoney, formatMoneyRounded, toAmount } from '../../lib/format-money'

describe('Las dos formas de escribir un monto', () => {
  it('conserva los centavos de lo que se contó', () => {
    expect(formatMoney('1234.56')).toBe('$1,234.56')
    expect(formatMoney('1234.5')).toBe('$1,234.50')
    expect(formatMoney(1234)).toBe('$1,234.00')
  })

  it('redondea a pesos enteros lo que se estimó', () => {
    expect(formatMoneyRounded('1234.56')).toBe('$1,235')
    expect(formatMoneyRounded(0.5)).toBe('$1')
  })

  it('escribe el mismo movimiento igual en las dos pantallas que lo listan', () => {
    expect(formatMoney('1234.56')).toBe(formatMoney(1234.56))
  })
})

describe('El signo y el símbolo', () => {
  it('pone el menos antes del peso, no después', () => {
    expect(formatMoneyRounded('-890')).toBe('-$890')
    expect(formatMoney('-890.25')).toBe('-$890.25')
  })

  it('escribe el símbolo corto, sin el prefijo del país', () => {
    expect(formatMoney('1000')).not.toContain('MX')
  })
})

describe('Un monto que no existe', () => {
  it('se escribe vacío, y el guión lo pone la pantalla', () => {
    expect(formatMoney(null)).toBe('')
    expect(formatMoney(undefined)).toBe('')
    expect(formatMoney('')).toBe('')
    expect(formatMoneyRounded('no es un monto')).toBe('')
  })

  it('nunca se convierte en cero ni en NaN', () => {
    for (const value of [null, undefined, '', 'abc']) {
      expect(formatMoney(value)).not.toContain('0')
      expect(formatMoney(value)).not.toContain('NaN')
    }
    expect(toAmount('0')).toBe(0)
    expect(formatMoney('0')).toBe('$0.00')
  })
})

describe('El tono de una cifra que puede ser pérdida', () => {
  it('nunca pinta una pérdida como ganancia', () => {
    expect(amountTone('-1')).toBe('danger')
    expect(amountTone('0')).toBe('success')
    expect(amountTone('1234.56')).toBe('success')
  })

  it('no opina sobre lo que no sabe', () => {
    expect(amountTone(null)).toBe('default')
  })
})
