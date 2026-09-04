// format-date.spec.ts: ported from creva_finance/frontend/test/lib — a value without an hour
// keeps its day and never gains one. Relies on the TZ this repo's jest config pins to
// America/Mexico_City: in UTC the defect never shows. The cross-repo "no screen writes its own
// date formatter" scan was dropped — app/features (screens) does not exist yet in this repo.
import {
  formatDay,
  formatDayWithYear,
  formatLongDay,
  formatMoment,
  formatMonth,
  formatTime,
  hasTime,
  toLocalDate,
} from '../../lib/format-date'

const DAY_ONLY = '2026-08-21'
const WITH_TIME = '2026-08-21T20:32:00.000Z'

describe('Lo que la API guarda', () => {
  it('distingue un día suelto de un instante', () => {
    expect(hasTime(DAY_ONLY)).toBe(false)
    expect(hasTime(WITH_TIME)).toBe(true)
  })

  it('deja el día suelto en su propio día, a medianoche local', () => {
    const date = toLocalDate(DAY_ONLY)
    expect(date.getDate()).toBe(21)
    expect(date.getMonth()).toBe(7)
    expect(date.getHours()).toBe(0)
  })
})

describe('Lo que la pantalla escribe', () => {
  it('escribe el día en es-MX', () => {
    expect(formatDay(DAY_ONLY)).toMatch(/^21 ago/)
  })

  it('no inventa una hora que el dato no tiene', () => {
    expect(formatTime(DAY_ONLY)).toBeNull()
    expect(formatMoment(DAY_ONLY, { withDay: false })).toBe('')
  })

  it('escribe la hora cuando el dato sí la trae', () => {
    expect(formatTime(WITH_TIME)).toBe('14:32')
    expect(formatMoment(WITH_TIME, { withDay: false })).toBe('14:32')
    expect(formatMoment(WITH_TIME)).toMatch(/^21 ago.*, 14:32$/)
  })

  it('devuelve el valor ilegible tal cual, no "Invalid Date"', () => {
    expect(formatDay('no es una fecha')).toBe('no es una fecha')
    expect(formatTime('no es una fecha')).toBeNull()
  })
})

describe('Las cuatro formas de escribir un día', () => {
  it('corta o alarga el mes, y agrega el año donde hace falta', () => {
    expect(formatDay(DAY_ONLY)).toBe('21 ago')
    expect(formatDayWithYear(DAY_ONLY)).toBe('21 ago 2026')
    expect(formatLongDay(DAY_ONLY)).toBe('21 de agosto de 2026')
  })

  it('escribe el mes con mayúscula, porque va solo como rótulo', () => {
    expect(formatMonth('2026-08')).toBe('Agosto de 2026')
  })

  it('lee un instante en la hora local, no en la de Londres', () => {
    expect(formatLongDay('2026-08-21T04:20:00.000Z')).toBe('20 de agosto de 2026')
  })

  it('escribe vacío lo que no existe, y deja el rótulo a la pantalla', () => {
    expect(formatDay(null)).toBe('')
    expect(formatDayWithYear(undefined)).toBe('')
    expect(formatLongDay('')).toBe('')
    expect(formatMonth(null)).toBe('')
  })
})
