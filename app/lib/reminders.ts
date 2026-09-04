// reminders.ts: turns the score, credit-eligibility and statement signals into the notification
// list, so the dashboard badge and the notifications screen always agree.

export type ReminderTone = 'action' | 'info' | 'done'

export interface Reminder {
  id: string
  title: string
  body: string
  cta: string
  href: string
  tone: ReminderTone
  /** Counts toward the dashboard badge. */
  pending: boolean
}

export interface ReminderInputs {
  /** `null` while unknown — the API answer decides, never a client-side threshold. */
  scoreStatus: string | null
  scoreValue: number | null
  creditEligible: boolean | null
  creditMissing: string[]
  statementCount: number | null
  statementEntryCount: number | null
}

const MISSING_CHANNEL_LABEL: Record<string, string> = {
  email_not_verified: 'tu correo',
  phone_not_verified: 'tu teléfono',
}

function joinEs(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  return `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`
}

function statementsReminder(input: ReminderInputs): Reminder | null {
  const { statementCount, statementEntryCount, scoreStatus } = input
  if (statementCount === null) return null

  if (statementCount === 0) {
    return {
      id: 'statements_missing',
      title: 'Sube tus estados de cuenta',
      body: 'Creva necesita tu historial del banco para construir tu Score Creva. Acepta CSV, Excel o PDF.',
      cta: 'Subir mis archivos',
      href: '/statements',
      tone: 'action',
      pending: true,
    }
  }

  const files = `${statementCount} ${statementCount === 1 ? 'archivo' : 'archivos'}`

  if (scoreStatus === 'insufficient_data') {
    return {
      id: 'statements_partial',
      title: 'Falta actividad para tu Score Creva',
      body: `Ya tienes ${files} cargados, pero todavía no alcanza. Agrega más meses o usa tu tarjeta unas semanas.`,
      cta: 'Agregar más meses',
      href: '/statements',
      tone: 'action',
      pending: true,
    }
  }

  const movements =
    statementEntryCount && statementEntryCount > 0
      ? ` · ${statementEntryCount} ${statementEntryCount === 1 ? 'movimiento' : 'movimientos'}`
      : ''

  return {
    id: 'statements_ok',
    title: 'Tus estados de cuenta están al día',
    body: `${files}${movements} alimentando tu score. Entre más meses, mejor te lee Creva.`,
    cta: 'Ver mis archivos',
    href: '/statements',
    tone: 'done',
    pending: false,
  }
}

function creditReminder(input: ReminderInputs): Reminder | null {
  const { creditEligible, creditMissing, scoreStatus, scoreValue } = input
  if (creditEligible === null) return null

  if (!creditEligible) {
    const channels = creditMissing
      .map(key => MISSING_CHANNEL_LABEL[key])
      .filter((label): label is string => Boolean(label))

    return {
      id: 'credit_blocked',
      title: 'Confirma tus datos de contacto',
      body: channels.length
        ? `Falta confirmar ${joinEs(channels)} para entregarte tu recomendación de crédito.`
        : 'Falta confirmar tus datos de contacto para entregarte tu recomendación de crédito.',
      cta: 'Confirmar ahora',
      href: '/credit',
      tone: 'action',
      pending: true,
    }
  }

  if (scoreStatus === 'insufficient_data') {
    return {
      id: 'credit_waiting',
      title: 'Tu recomendación de crédito está en pausa',
      body: 'En cuanto Creva pueda calcular tu score, te decimos a qué créditos calificas — sin consultar tu buró.',
      cta: 'Ver qué falta',
      href: '/statements',
      tone: 'info',
      pending: true,
    }
  }

  return {
    id: 'credit_ready',
    title: 'Ya puedes ver a qué créditos calificas',
    body:
      scoreValue !== null
        ? `Tu Score Creva es ${scoreValue}. Revisa los productos compatibles con tu perfil.`
        : 'Revisa los productos compatibles con tu perfil, con los criterios que cumpliste.',
    cta: 'Ver mis opciones',
    href: '/credit',
    tone: 'action',
    pending: true,
  }
}

/** Actionable items first, resolved ones last. */
export function buildReminders(input: ReminderInputs): Reminder[] {
  const list = [creditReminder(input), statementsReminder(input)].filter(
    (item): item is Reminder => item !== null,
  )
  return list.sort((a, b) => Number(b.pending) - Number(a.pending))
}

export function pendingCount(reminders: Reminder[]): number {
  return reminders.filter(item => item.pending).length
}
