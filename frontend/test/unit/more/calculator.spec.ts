// calculator.spec.ts: CalculatorScreen ports the reference app/calculator/page.tsx — period profit,
// the API's suggested split, and a what-if income field, all read from calculator.get(). Source-
// string checks, same convention as more/business-verification.spec.ts.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/more/CalculatorScreen.tsx'), 'utf-8')
const appSource = readFileSync(join(__dirname, '../../../App.tsx'), 'utf-8')

describe('CalculatorScreen structure', () => {
  it('reads every figure from the real endpoint, never recomputing the split', () => {
    expect(source).toMatch(/calculator\.get\(override \|\| undefined\)/)
    expect(source).toMatch(/splitPercent\(parts\.map/)
    expect(source).toMatch(/value=\{shares\[i\]\}/)
  })

  it('sends the what-if income as a query override and can reset to real figures', () => {
    expect(source).toMatch(/load\(income\)/)
    expect(source).toMatch(/setIncome\(""\)[\s\S]*?load\(\)/)
    expect(source).toMatch(/digitsOnly/)
  })

  it('keeps the reference section copy', () => {
    expect(source).toContain('Qué hacer con lo que queda')
    expect(source).toContain('Prueba otro ingreso')
    expect(source).toContain('De dónde sale cada cifra')
    expect(source).toContain('No se guarda nada.')
  })

  it('exposes stable testIDs for loading, error, input and calculate', () => {
    for (const id of ['calculator-screen', 'calculator-loading', 'calculator-error', 'calculator-income-input', 'calculator-calc-cta']) {
      expect(source).toContain(id)
    }
  })

  it('is wired into App.tsx in place of the generic stub', () => {
    expect(appSource).toMatch(/import \{ CalculatorScreen \} from "\.\/features\/more\/CalculatorScreen"/)
    expect(appSource).toMatch(/activeStub === "calculator"[\s\S]*?<CalculatorScreen/)
  })
})
