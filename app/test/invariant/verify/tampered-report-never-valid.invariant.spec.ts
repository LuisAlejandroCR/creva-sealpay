// tampered-report-never-valid.invariant.spec.ts: enforces the verify screen seal boundary.
// A report whose identifying folio has been stripped is treated as tampered and must never verify
// as a valid seal, regardless of the original report contents shown by the mock client.
import fc from 'fast-check'
import { fetchSealedReport, verifySealSignature } from '../../../features/verify/sealClient'

describe('A tampered report never verifies as a valid seal', () => {
  it('rejects reports whose folio was removed after retrieval', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async originalFolio => {
        const report = await fetchSealedReport(originalFolio)
        const tamperedReport = { ...report, folio: '' }

        const result = await verifySealSignature(tamperedReport.folio)

        expect(result.valid).toBe(false)
      }),
      { numRuns: 50 },
    )
  })
})