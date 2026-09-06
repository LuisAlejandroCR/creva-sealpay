// structure.spec.ts: DashboardScreen keeps the panorama structure the reference dashboard/page.tsx
// establishes — score section first, then the balance metric, then cards/activity — and reuses
// the query feature's shared visual primitives rather than duplicating them.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/dashboard/DashboardScreen.tsx'), 'utf-8')

describe('DashboardScreen structure', () => {
  it('reuses the shared query VisualPrimitives and ScoreGauge instead of duplicating them', () => {
    expect(source).toMatch(/from "\.\.\/query\/components\/VisualPrimitives"/)
    expect(source).toMatch(/from "\.\.\/query\/components\/ScoreGauge"/)
  })

  it('renders the score section before the balance metric', () => {
    const scoreIndex = source.indexOf('Tu score')
    const balanceIndex = source.indexOf('Saldo disponible')
    expect(scoreIndex).toBeGreaterThanOrEqual(0)
    expect(balanceIndex).toBeGreaterThan(scoreIndex)
  })

  it('surfaces a notification bell driven by app/lib/reminders', () => {
    expect(source).toMatch(/from "\.\.\/\.\.\/lib\/reminders"/)
    expect(source).toMatch(/<NotificationBell/)
  })

  it('exposes navigation callbacks without importing App.tsx or wiring navigation itself', () => {
    expect(source).toMatch(/onOpenScore/)
    expect(source).toMatch(/onOpenCredit/)
    expect(source).not.toMatch(/from ["'].*App["']/)
  })
})
