// notifications.spec.ts: NotificationsScreen ports the reference app/notifications/page.tsx — the
// "Avisos" list built from real score/credit/statement signals via app/lib/reminders, plus the
// rewards block. Source-string checks, same convention as more/movements.spec.ts.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/more/NotificationsScreen.tsx'), 'utf-8')
const appSource = readFileSync(join(__dirname, '../../../App.tsx'), 'utf-8')

describe('NotificationsScreen structure', () => {
  it('builds the list from real APIs, not mock data', () => {
    expect(source).toMatch(/Promise\.allSettled\(/)
    expect(source).toMatch(/scoreApi\.get\(\)/)
    expect(source).toMatch(/credit\.eligibility\(\)/)
    expect(source).toMatch(/statements\.list\(\)/)
    expect(source).toMatch(/statements\.summary\(\)/)
  })

  it('feeds the shared reminder builder that also drives the dashboard badge', () => {
    expect(source).toMatch(/from "\.\.\/\.\.\/lib\/reminders"/)
    expect(source).toMatch(/buildReminders\(/)
    expect(source).toMatch(/pendingCount\(/)
  })

  it('keeps the reference subtitle copy for each pending count', () => {
    expect(source).toContain('Revisando qué te falta…')
    expect(source).toContain('Estás al corriente. Aquí te avisamos cuando haya algo que hacer.')
    expect(source).toContain('Tienes 1 cosa pendiente para sacarle más a Creva.')
    expect(source).toContain('cosas pendientes para sacarle más a Creva.')
  })

  it('renders the coming-soon rewards block', () => {
    expect(source).toContain('Beneficios y recompensas')
    expect(source).toContain('Próximamente')
    expect(source).toContain('rewards-section')
  })

  it('exposes stable testIDs for loading, empty and rows', () => {
    for (const id of ['notifications-screen', 'notifications-loading', 'notifications-empty', 'notification-reminder']) {
      expect(source).toContain(id)
    }
  })

  it('is wired into App.tsx in place of the generic stub', () => {
    expect(appSource).toMatch(/import \{ NotificationsScreen \} from "\.\/features\/more\/NotificationsScreen"/)
    expect(appSource).toMatch(/activeStub === "notifications"[\s\S]*?<NotificationsScreen/)
  })
})
