// render.spec.ts: a real render test (not source-regex) for ScoreScreen's data states — the real
// score paints, the loading spinner and the error message each show, and the error path never
// falls back to a number. api.ts is mocked at the network boundary. Same SafeAreaView mock as
// test/unit/auth/auth-gate.spec.ts and test/unit/help/search.spec.ts.
import { createElement } from 'react'
import { render, screen, waitFor } from '@testing-library/react-native'

import type { ScoreData } from '../../../lib/api'

jest.mock('react-native-safe-area-context', () => {
  const mock = jest.requireActual('react-native-safe-area-context/jest/mock').default
  return { ...mock }
})

const mockScoreGet = jest.fn()
const mockRecsGet = jest.fn()
const mockDisclosureGet = jest.fn()

jest.mock('../../../lib/api', () => ({
  score: { get: () => mockScoreGet() },
  recommendations: { get: () => mockRecsGet() },
  crevaScore: { disclosure: () => mockDisclosureGet() },
  isBackendUnlinked: () => false,
}))

import { ScoreScreen } from '../../../features/score/ScoreScreen'

const SCORE: ScoreData = {
  status: 'ok',
  score: 63,
  maxScore: 100,
  band: 'fair',
  scoreVersion: '1.0',
  periodStart: '2026-06-01',
  periodEnd: '2026-08-31',
  factors: [
    { name: 'consistency_score', score: 12, maxScore: 25, band: 'poor', rationale: 'Registraste 8 de 30 días.' },
  ],
}

beforeEach(() => {
  mockScoreGet.mockReset()
  mockRecsGet.mockReset().mockResolvedValue({ status: 'ok', recommendations: [] })
  mockDisclosureGet.mockReset().mockRejectedValue(new Error('no disclosure'))
})

const props = { onOpenQuery: jest.fn(), onBack: jest.fn(), onOpenHelp: jest.fn() }

describe('ScoreScreen render states', () => {
  it('shows the loading spinner before the score resolves', async () => {
    let resolve: (v: ScoreData) => void = () => {}
    mockScoreGet.mockReturnValue(new Promise<ScoreData>((r) => { resolve = r }))
    await render(createElement(ScoreScreen, props))
    expect(screen.getByTestId('score-loading')).toBeTruthy()
    resolve(SCORE)
    await waitFor(() => expect(screen.queryByTestId('score-loading')).toBeNull())
  })

  it('paints the real score value from the API', async () => {
    mockScoreGet.mockResolvedValue(SCORE)
    await render(createElement(ScoreScreen, props))
    await waitFor(() => expect(screen.getByText('63')).toBeTruthy())
    expect(screen.getByText('Constancia de uso')).toBeTruthy()
    expect(screen.getByText('12/25')).toBeTruthy()
  })

  it('shows a visible error message and no number when the score call fails', async () => {
    mockScoreGet.mockRejectedValue(new Error('500'))
    await render(createElement(ScoreScreen, props))
    expect(await screen.findByTestId('score-error')).toBeTruthy()
    expect(screen.queryByTestId('score-loading')).toBeNull()
    expect(screen.queryAllByText(/^\d{1,3}$/)).toEqual([])
  })

  it('renders the error state when the API returns a null score', async () => {
    mockScoreGet.mockResolvedValue({ ...SCORE, score: null, factors: null })
    await render(createElement(ScoreScreen, props))
    expect(await screen.findByTestId('score-error')).toBeTruthy()
  })
})
