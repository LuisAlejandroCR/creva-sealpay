// score-real-only.invariant.spec.ts: two invariants for the score screen.
//  1. The score is fetched core-direct with the caller's Clerk session (api.ts's score.get()
//     against BASE = EXPO_PUBLIC_API_URL), never through the gateway or a service identity.
//  2. ScoreScreen has no numeric fallback: on any non-success path it renders the error state,
//     and the only value ever handed to the gauge is the one from score.get().
import { readFileSync } from 'fs'
import { join } from 'path'
import { createElement } from 'react'
import { render, screen } from '@testing-library/react-native'

const screenSrc = readFileSync(join(__dirname, '../../../features/score/ScoreScreen.tsx'), 'utf-8')
const apiSrc = readFileSync(join(__dirname, '../../../lib/api.ts'), 'utf-8')

jest.mock('react-native-safe-area-context', () => {
  const mock = jest.requireActual('react-native-safe-area-context/jest/mock').default
  return { ...mock }
})
jest.mock('../../../lib/api', () => ({
  score: { get: () => Promise.reject(new Error('boom')) },
  recommendations: { get: () => Promise.resolve({ status: 'ok', recommendations: [] }) },
  crevaScore: { disclosure: () => Promise.reject(new Error('none')) },
  isBackendUnlinked: () => false,
}))

import { ScoreScreen } from '../../../features/score/ScoreScreen'

describe('score is core-direct, not gateway / service identity', () => {
  it('api.ts routes GET /score to BASE (the Clerk backend), keyed only by EXPO_PUBLIC_API_URL', () => {
    expect(apiSrc).toMatch(/const BASE = process\.env\.EXPO_PUBLIC_API_URL/)
    expect(apiSrc).toMatch(/get:\s*\(\)\s*=>\s*request<ScoreData>\('\/score'\)/)
  })

  it('the request helper only ever attaches the session-source Clerk token, never a static one', () => {
    expect(apiSrc).toMatch(/Authorization: `Bearer \$\{token\}`/)
    expect(apiSrc).not.toMatch(/getCrevaAccessToken|SERVICE_|service identity/i)
  })

  it('ScoreScreen never imports a gateway client or a hardcoded token', () => {
    expect(screenSrc).not.toMatch(/gateway/i)
    expect(screenSrc).not.toMatch(/EXPO_PUBLIC_GATEWAY_URL/)
    expect(screenSrc).not.toMatch(/Bearer /)
  })
})

describe('no numeric fallback', () => {
  it('source has no numeric score default and only feeds the gauge the fetched value', () => {
    expect(screenSrc).not.toMatch(/scoreValue\s*=\s*\d/)
    expect(screenSrc).toMatch(/const scoreValue = data\?\.score \?\? null/)
    expect(screenSrc).toMatch(/<ScoreGauge value=\{scoreValue\}/)
    expect(screenSrc).toMatch(/error \|\| scoreValue === null \?/)
  })

  it('renders the error state and no digits when score.get() rejects', async () => {
    await render(createElement(ScoreScreen, { onOpenQuery: jest.fn() }))
    expect(await screen.findByTestId('score-error')).toBeTruthy()
    expect(screen.queryAllByText(/^\d{1,3}$/)).toEqual([])
  })
})
