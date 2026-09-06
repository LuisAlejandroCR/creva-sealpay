// curp-never-false-positive.invariant.spec.ts: the KYC form must never let a malformed identifier
// through to kyc.apply. Invariants that must hold for every input: a CURP failing the RENAPO shape
// never validates true, and a normalised phone is either empty or a +52… international number.
import fc from 'fast-check'
import { CURP_RX, isValidCurp, formatMxPhone } from '../../../features/onboarding/kyc-format'

describe('invariant: KYC input can never be spoofed past validation', () => {
  it('isValidCurp agrees with the shape regex for every input', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 200 }), (input) => {
        expect(isValidCurp(input)).toBe(CURP_RX.test(input))
      }),
      { numRuns: 1000 },
    )
  })

  it('a CURP with a lowercase letter or wrong length never validates', () => {
    const nearValid = fc
      .tuple(
        fc.stringMatching(/^[A-Z]{4}$/),
        fc.stringMatching(/^\d{6}$/),
        fc.constantFrom('H', 'M'),
        fc.stringMatching(/^[A-Z]{5}$/),
        fc.stringMatching(/^[A-Z0-9]$/),
        fc.stringMatching(/^\d$/),
      )
      .map((parts) => parts.join(''))
    fc.assert(
      fc.property(nearValid, fc.string({ minLength: 1, maxLength: 4 }), (curp, junk) => {
        expect(isValidCurp(curp.toLowerCase())).toBe(false)
        expect(isValidCurp(curp + junk)).toBe(false)
      }),
      { numRuns: 500 },
    )
  })

  it('formatMxPhone output is empty or a + international number, never a bare local one', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 200 }), (input) => {
        const out = formatMxPhone(input)
        if (out.length > 0) expect(out.startsWith('+')).toBe(true)
      }),
      { numRuns: 1000 },
    )
  })
})
