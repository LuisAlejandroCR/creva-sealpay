// structure.spec.ts: CardScreen + CardCreateScreen port creva_finance's app/cards/page.tsx,
// app/cards/[id]/page.tsx and app/card-create/page.tsx — real card list, limit, freeze, movements
// and issuance. Source-string checks, same convention as the rest of the batch.
import { readFileSync } from 'fs'
import { join } from 'path'

const screen = readFileSync(join(__dirname, '../../../features/card/CardScreen.tsx'), 'utf-8')
const create = readFileSync(join(__dirname, '../../../features/card/CardCreateScreen.tsx'), 'utf-8')
const app = readFileSync(join(__dirname, '../../../App.tsx'), 'utf-8')

describe('CardScreen structure', () => {
  it('reads the real card, its limit and its movements — no mock card', () => {
    expect(screen).toMatch(/cards\s*\n?\s*\.list\(\)/)
    expect(screen).toMatch(/cards\.get\(list\[0\]\.id\)/)
    expect(screen).toMatch(/transactions\s*\n?\s*\.list\(\{ limit: 20 \}\)/)
    expect(screen).not.toMatch(/PRONTO|por-que-dice-pronto/)
  })

  it('freezes and unfreezes against the real endpoints', () => {
    expect(screen).toMatch(/cards\.unfreeze\(userCard\.id\)/)
    expect(screen).toMatch(/cards\.freeze\(userCard\.id\)/)
  })

  it('branches on kyc + card readiness like the reference', () => {
    expect(screen).toMatch(/result\.kyc\?\.status === "approved"/)
    expect(screen).toContain('Sin tarjetas aún')
    expect(screen).toMatch(/kycDone \? onOpenCreate : onOpenKyc/)
  })
})

describe('CardCreateScreen structure', () => {
  it('issues the card via the real endpoint, once, after KYC is confirmed', () => {
    expect(create).toMatch(/cards\.issue\(\{\}\)/)
    expect(create).toMatch(/result\.kyc\?\.status === "approved"/)
  })

  it('handles the 409 (already exists) and 400 (missing kyc/collateral) branches', () => {
    expect(create).toMatch(/error\.status === 409/)
    expect(create).toMatch(/error\.status === 400/)
  })
})

describe('App.tsx card wiring', () => {
  it('turns the Tarjeta tab into a live route and adds the card-create step', () => {
    expect(app).toMatch(/\{ key: "card", label: "Tarjeta", icon: "card", step: "card-info" \}/)
    expect(app).toMatch(/step === "card-create"[\s\S]*?<CardCreateScreen/)
    expect(app).toMatch(/onOpenCreate=\{\(\) => setStep\("card-create"\)\}/)
  })
})
