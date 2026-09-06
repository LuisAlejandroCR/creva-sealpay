// structure.spec.ts: CreditScreen + CreditRequestForm port creva_finance's app/credit/page.tsx
// and components/credit/RequestForm.tsx — the contact gate, the 4-step declared-figures request,
// the explained matches, and the optional KYC. Source-string checks, same convention as the rest.
import { readFileSync } from 'fs'
import { join } from 'path'

const screen = readFileSync(join(__dirname, '../../../features/credit/CreditScreen.tsx'), 'utf-8')
const form = readFileSync(join(__dirname, '../../../features/credit/CreditRequestForm.tsx'), 'utf-8')
const app = readFileSync(join(__dirname, '../../../App.tsx'), 'utf-8')

describe('CreditScreen structure', () => {
  it('drives the whole flow off the real credit endpoints, no mock catalog', () => {
    expect(screen).toMatch(/\.eligibility\(\)/)
    expect(screen).toMatch(/\.recommend\(next\)/)
    expect(screen).toMatch(/credit\.select\(\{ productId: match\.productId, \.\.\.request \}\)/)
    expect(screen).toMatch(/credit\.updateSelection\(selectionId, status\)/)
    expect(screen).not.toMatch(/credit-catalog-placeholder|Próximamente/)
  })

  it('gates on contact verification with the email link and phone-code sub-flows', () => {
    expect(screen).toMatch(/email_not_verified/)
    expect(screen).toMatch(/phone_not_verified/)
    expect(screen).toMatch(/auth\.sendPhoneCode\(/)
    expect(screen).toMatch(/auth\.verifyPhoneCode\(/)
    expect(screen).toMatch(/auth\.forgotPassword\(me\.email\)/)
  })

  it('shows every match criterion (passed or not), never colour alone', () => {
    expect(screen).toMatch(/match\.matchFactors\.map/)
    expect(screen).toMatch(/factor\.passed \?/)
    expect(screen).toContain('Requisito del producto:')
  })

  it('handles all four recommendation statuses', () => {
    for (const status of ['ok', 'insufficient_data', 'no_match', 'not_eligible']) {
      expect(screen).toContain(`result.status === "${status}"`)
    }
  })

  it('is wired into App.tsx with the kyc and statements hand-offs', () => {
    expect(app).toMatch(/onOpenKyc=\{\(\) => setStep\("kyc"\)\}/)
    expect(app).toMatch(/onOpenStatements=\{\(\) => openStub\("statements", "credit"\)\}/)
  })
})

describe('CreditRequestForm structure', () => {
  it('is a four-step form that prefills from the fiscal profile and last declaration', () => {
    expect(form).toMatch(/profiles\.getFiscal\(\)/)
    expect(form).toMatch(/declarations\.latest\(\)/)
    expect(form).toMatch(/TITLES = \["Tu negocio", "Tus ingresos", "Tus gastos", "Tu solicitud"\]/)
  })

  it('saves the fiscal profile and the declaration before handing over the request', () => {
    expect(form).toMatch(/profiles\.updateFiscal\(\{/)
    expect(form).toMatch(/declarations\.create\(\{/)
    expect(form).toMatch(/onSubmit\(\{ amount: `\$\{parseInt\(amount \|\| "0", 10\)\}`, purpose, termMonths \}\)/)
  })

  it('skips straight to step 4 when the last declaration already covers the current 3 months', () => {
    expect(form).toMatch(/declaration\.months\.some\(\(declared\) => declared\.month === month\)/)
    expect(form).toMatch(/setStep\(4\)/)
  })

  it('states the query does not touch her credit history', () => {
    expect(form).toContain('Esta consulta no afecta tu historial crediticio.')
  })
})
