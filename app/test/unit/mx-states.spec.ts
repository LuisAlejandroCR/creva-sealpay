// mx-states.spec.ts: ported unmodified from creva_finance/frontend/test/lib — pins the state
// catalogue against codes confirmed in live responses.
import { MX_STATES, stateLabel } from '../../lib/mx-states'

describe('MX_STATES', () => {
  it('carries the 32 federal entities', () => {
    expect(MX_STATES).toHaveLength(32)
  })

  it('numbers them 1 to 32 with no gaps or repeats', () => {
    const codes = MX_STATES.map(state => state.code)
    expect(codes).toEqual(Array.from({ length: 32 }, (_, i) => i + 1))
  })

  it.each([
    [8, 'Chihuahua'],
    [9, 'Ciudad de México'],
    [14, 'Jalisco'],
    [15, 'Estado de México'],
    [19, 'Nuevo León'],
    [21, 'Puebla'],
    [29, 'Tlaxcala'],
  ])('maps %i to %s', (code, label) => {
    expect(stateLabel(code)).toBe(label)
  })

  it('returns null for no state and for a code outside the catalogue', () => {
    expect(stateLabel(null)).toBeNull()
    expect(stateLabel(99)).toBeNull()
  })
})
