// report.spec.ts: ReportScreen ports the reference app/report/page.tsx — the button-gated composed
// report from crevaScore.report() (a POST that spends provider quota), rendered per category with
// its seal. Source-string checks, same convention as more/regulatory.spec.ts.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/more/ReportScreen.tsx'), 'utf-8')
const appSource = readFileSync(join(__dirname, '../../../App.tsx'), 'utf-8')

describe('ReportScreen structure', () => {
  it('builds the report only on an explicit tap, never on mount', () => {
    expect(source).toMatch(/\.report\(\)/)
    expect(source).not.toMatch(/useEffect/)
    expect(source).toContain('report-generate-cta')
  })

  it('reuses the shared report-display maps so screen and paper agree', () => {
    expect(source).toMatch(/from "\.\.\/\.\.\/lib\/report-display"/)
    expect(source).toMatch(/REPORT_CATEGORIES\.map/)
    expect(source).toMatch(/CATEGORY_TITLES\[category\]/)
  })

  it('spells out how few signals are about the business, like the reference', () => {
    expect(source).toMatch(/category === "business_verification"/)
    expect(source).toContain('son sobre tu negocio')
    expect(source).toContain('Lo que este reporte NO dice')
  })

  it('hands over the sealed file via the native Share sheet, not a browser download', () => {
    expect(source).toMatch(/Share\.share\(/)
    expect(source).toMatch(/JSON\.stringify\(sealed/)
    expect(source).not.toMatch(/createObjectURL|window\.print/)
  })

  it('exposes stable testIDs for the generate, error, seal and share surfaces', () => {
    for (const id of ['report-screen', 'report-generate-cta', 'report-error', 'report-seal', 'report-share-cta']) {
      expect(source).toContain(id)
    }
  })

  it('is wired into App.tsx in place of the generic stub', () => {
    expect(appSource).toMatch(/import \{ ReportScreen \} from "\.\/features\/more\/ReportScreen"/)
    expect(appSource).toMatch(/activeStub === "report"[\s\S]*?<ReportScreen/)
  })
})
