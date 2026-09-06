// reminders.spec.ts: ported unmodified from creva_finance/frontend/test/lib.
import { buildReminders, pendingCount } from '../../lib/reminders'
import type { ReminderInputs } from '../../lib/reminders'

function scored(
  overrides: Partial<ReminderInputs> = {},
): ReminderInputs {
  return {
    scoreStatus: 'scored',
    scoreValue: 72,
    creditEligible: true,
    creditMissing: [],
    statementCount: 3,
    statementEntryCount: 84,
    ...overrides,
  }
}

describe('buildReminders', () => {
  it('returns empty for eligible + scored user with statements', () => {
    const r = buildReminders(scored())
    expect(r.every((x) => x.tone === 'done' || x.tone === 'action')).toBe(true)
  })

  it('flags missing contact when channels are blocked', () => {
    const r = buildReminders(
      scored({ creditEligible: false, creditMissing: ['email_not_verified'] }),
    )
    const contact = r.find((x) => x.id === 'credit_blocked')
    expect(contact).toBeDefined()
    expect(contact!.pending).toBe(true)
  })

  it('flags insufficient data for credit when no score', () => {
    const r = buildReminders(
      scored({ creditEligible: true, scoreStatus: 'insufficient_data', statementCount: 0 }),
    )
    const credit = r.find((x) => x.id === 'credit_waiting')
    expect(credit).toBeDefined()
    expect(credit!.pending).toBe(true)
  })

  it('shows credit ready when eligible and scored', () => {
    const r = buildReminders(scored({ statementCount: 3, statementEntryCount: 84 }))
    const credit = r.find((x) => x.id === 'credit_ready')
    expect(credit).toBeDefined()
    expect(credit!.pending).toBe(true)
  })

  it('suggests uploading statements when none exist', () => {
    const r = buildReminders(scored({ statementCount: 0 }))
    const st = r.find((x) => x.id === 'statements_missing')
    expect(st).toBeDefined()
    expect(st!.pending).toBe(true)
  })

  it('pendingCount counts only pending reminders', () => {
    const r = buildReminders(
      scored({
        creditEligible: false,
        creditMissing: ['email_not_verified'],
        scoreStatus: 'insufficient_data',
        statementCount: 0,
      }),
    )
    expect(pendingCount(r)).toBeGreaterThanOrEqual(2)
  })
})
