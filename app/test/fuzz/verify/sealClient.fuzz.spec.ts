// sealClient.fuzz.spec.ts: fuzzes the verify screen sealed-report mock boundary.
// Arbitrary folios must still return the fixed public verification shape used by the screen,
// so malformed input cannot crash the verifier UI path.
import fc from 'fast-check'
import { fetchSealedReport } from '../../../features/verify/sealClient'

describe('Verify folio fuzzing', () => {
  it('returns a well-formed sealed report for arbitrary folio strings', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async folio => {
        const report = await fetchSealedReport(folio)

        expect(report.folio).toBe(folio)
        expect(report.signatureAlgorithm).toBe('Ed25519')
        expect(report.verdicts).toHaveLength(5)
        expect(report.doesNotCertify.length).toBeGreaterThan(0)
      }),
      { numRuns: 50 },
    )
  })
})