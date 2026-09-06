// kyc-format.fuzz.spec.ts: hostile input at the KYC form's validation boundary — the CURP field
// and phone field take whatever the user types. Property: the helpers never throw and always
// return a well-formed result, no matter the input.
import fc from 'fast-check'
import { isValidCurp, formatMxPhone } from '../../../features/onboarding/kyc-format'

describe('kyc-format fuzz', () => {
  it('isValidCurp never throws and always returns a boolean', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 300 }), (input) => {
        const out = isValidCurp(input)
        expect(typeof out).toBe('boolean')
      }),
      { numRuns: 500 },
    )
  })

  it('formatMxPhone never throws and always returns a string', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 300 }), (input) => {
        const out = formatMxPhone(input)
        expect(typeof out).toBe('string')
      }),
      { numRuns: 500 },
    )
  })

  it('isValidCurp stays false for anything that is not 18 chars', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 300 }).filter((s) => s.length !== 18),
        (input) => {
          expect(isValidCurp(input)).toBe(false)
        },
      ),
      { numRuns: 500 },
    )
  })
})
