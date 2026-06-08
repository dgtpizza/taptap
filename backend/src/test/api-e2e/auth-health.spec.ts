import { test, expect } from './fixtures'
import { signInitData } from '../helpers/initData'
import { TEST_BOT_TOKEN } from './config'

test('/health returns { ok: true }', async ({ api }) => {
  const res = await api.get('/health')
  expect(res.status()).toBe(200)
  const b = await res.json()
  expect(b.ok).toBe(true)
})

test('CORS preflight allows the configured frontend origin and auth headers', async ({ api }) => {
  const res = await api.fetch('/api/me', {
    method: 'OPTIONS',
    headers: {
      origin: 'http://127.0.0.1:5173',
      'access-control-request-method': 'GET',
      'access-control-request-headers': 'authorization,content-type',
    },
  })
  expect(res.status()).toBe(204)
  expect(res.headers()['access-control-allow-origin']).toBe('http://127.0.0.1:5173')
  expect(res.headers()['access-control-allow-headers']).toContain('authorization')
})

test('auth: missing authorization header returns 401', async ({ api }) => {
  const res = await api.get('/api/me')
  expect(res.status()).toBe(401)
  const b = await res.json()
  expect(b.error.code).toBe('UNAUTHORIZED')
})

test('auth: authorization without tma prefix returns 401', async ({ api }) => {
  const init = signInitData({ id: 7301, first_name: 'NoPrefix' }, TEST_BOT_TOKEN)
  const res = await api.get('/api/me', { headers: { authorization: init } })
  expect(res.status()).toBe(401)
})

test('auth: signature made with another token returns 401', async ({ api }) => {
  const bad = signInitData({ id: 7302, first_name: 'Bad' }, 'wrong-token:xyz')
  const res = await api.get('/api/me', { headers: { authorization: `tma ${bad}` } })
  expect(res.status()).toBe(401)
})

test('auth: stale initData returns 401', async ({ api }) => {
  const old = signInitData({ id: 7303, first_name: 'Old' }, TEST_BOT_TOKEN, 1000)
  const res = await api.get('/api/me', { headers: { authorization: `tma ${old}` } })
  expect(res.status()).toBe(401)
})

test('auth: valid initData passes protected API routes', async ({ api }) => {
  const headers = { authorization: `tma ${signInitData({ id: 7304, first_name: 'Valid' }, TEST_BOT_TOKEN)}` }
  const lb = await api.get('/api/leaderboard', { headers })
  expect(lb.status()).toBe(200)
})

test('unknown /api route returns 404 VALIDATION', async ({ api }) => {
  const headers = { authorization: `tma ${signInitData({ id: 7305, first_name: 'NF' }, TEST_BOT_TOKEN)}` }
  const res = await api.get('/api/does-not-exist', { headers })
  expect(res.status()).toBe(404)
  const b = await res.json()
  expect(b.error.code).toBe('VALIDATION')
})
