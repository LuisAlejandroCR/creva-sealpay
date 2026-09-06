// score-render.fuzz.spec.ts: whatever number the API sends, ScoreScreen paints that exact number
// and no other; whatever error it throws, ScoreScreen shows the error state and paints no number.
import { createElement } from 'react'
import fc from 'fast-check'
import { render, screen, waitFor, cleanup } from '@testing-library/react-native'

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
}))

import { ScoreScreen } from '../../../features/score/ScoreScreen'

function base(score: number | null): ScoreData {
  return {
    status: 'ok',
    score,
    maxScore: 100,
    band: null,
    scoreVersion: '1.0',
    periodStart: null,
    periodEnd: null,
    factors: null,
  }
}

beforeEach(() => {
  mockRecsGet.mockResolvedValue({ status: 'ok', recommendations: [] })
  mockDisclosureGet.mockRejectedValue(new Error('none'))
})
afterEach(() => cleanup())

const props = { onOpenQuery: jest.fn() }

describe('ScoreScreen fuzz', () => {
  it('paints exactly the API score, for any value in range', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 100 }), async (value) => {
        mockScoreGet.mockResolvedValue(base(value))
        await render(createElement(ScoreScreen, props))
        await waitFor(() => expect(screen.getByText(String(value))).toBeTruthy())
        expect(screen.queryByTestId('score-error')).toBeNull()
        cleanup()
      }),
      { numRuns: 20 },
    )
  })

  it('never paints a number when the score call rejects', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (message) => {
        mockScoreGet.mockRejectedValue(new Error(message))
        await render(createElement(ScoreScreen, props))
        await screen.findByTestId('score-error')
        expect(screen.queryAllByText(/^\d{1,3}$/)).toEqual([])
        cleanup()
      }),
      { numRuns: 20 },
    )
  })

  it('treats a null score as an error, never a zero or a blank gauge', async () => {
    mockScoreGet.mockResolvedValue(base(null))
    await render(createElement(ScoreScreen, props))
    expect(await screen.findByTestId('score-error')).toBeTruthy()
  })
})
