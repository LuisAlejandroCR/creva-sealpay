// score-real-only.invariant.spec.ts: two invariants for the score screen.
//  1. The score is fetched with the caller's own Clerk session — never a static or service
//     identity. It now goes through the Express backend (api.ts's score.get() via the `b` helper
//     against BACKEND = EXPO_PUBLIC_BACKEND_URL), which validates the Clerk token itself and
//     forwards the resolved auth.users id; it is still not the gateway's x402 path.
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

describe('score uses the caller Clerk session, not gateway / service identity', () => {
  it('api.ts routes GET /score through the backend base (EXPO_PUBLIC_BACKEND_URL)', () => {
    expect(apiSrc).toMatch(/const BACKEND = process\.env\.EXPO_PUBLIC_BACKEND_URL/)
    expect(apiSrc).toMatch(/get:\s*\(\)\s*=>\s*b<ScoreData>\('\/score'\)/)
    // `b` is the backend-based wrapper around request()
    expect(apiSrc).toMatch(/const b = <T>\(path: string, init\?: RequestInit\) => request<T>\(path, init, BACKEND\)/)
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
