import { randomUUID } from 'node:crypto'
import { test, expect } from './fixtures'
import { signInitData } from '../helpers/initData'
import { TEST_BOT_TOKEN, MAX_BATCH, ENERGY_MAX } from './config'

const auth = (id: number) => ({
  headers: { authorization: `tma ${signInitData({ id, first_name: `C${id}` }, TEST_BOT_TOKEN)}` },
})
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

test('/api/me creates a new user with initial clicks and energy', async ({ api }) => {
  const res = await api.get('/api/me', auth(7101))
  expect(res.status()).toBe(200)
  const me = await res.json()
  expect(me.telegramId).toBe(7101)
  expect(me.firstName).toBe('C7101')
  expect(me.clicks).toBe(0)
  expect(me.energy).toBeGreaterThan(0)
  expect(me.energy).toBeLessThanOrEqual(ENERGY_MAX)
  expect(me.energyMax).toBe(ENERGY_MAX)
  expect(me.regenPerSec).toBeGreaterThan(0)
  expect(me.rank).toBeUndefined()
})

test('/api/me reflects clicks accumulated through /api/clicks', async ({ api }) => {
  const a = auth(7102)
  let expected = 0
  for (let i = 0; i < 3; i++) {
    const b = await (await api.post('/api/clicks', { ...a, data: { count: 4, nonce: randomUUID() } })).json()
    expected += b.accepted
    await sleep(260)
  }
  const me = await (await api.get('/api/me', a)).json()
  expect(me.clicks).toBe(expected)
  expect(expected).toBe(12)
})

test('/api/clicks returns accepted clicks and the updated snapshot', async ({ api }) => {
  const res = await api.post('/api/clicks', { ...auth(7103), data: { count: 5, nonce: randomUUID() } })
  expect(res.status()).toBe(200)
  const b = await res.json()
  expect(b.accepted).toBe(5)
  expect(b.clicks).toBe(5)
  expect(b.energyMax).toBe(ENERGY_MAX)
  expect(b.energy).toBeLessThanOrEqual(ENERGY_MAX)
  expect(b.energy).toBeGreaterThanOrEqual(0)
})

test('/api/clicks rejects count above MAX_BATCH with 400 VALIDATION', async ({ api }) => {
  const res = await api.post('/api/clicks', { ...auth(7104), data: { count: MAX_BATCH + 1, nonce: randomUUID() } })
  expect(res.status()).toBe(400)
  const b = await res.json()
  expect(b.error.code).toBe('VALIDATION')
})

test('/api/clicks rejects a missing nonce with 400', async ({ api }) => {
  const res = await api.post('/api/clicks', { ...auth(7105), data: { count: 1 } })
  expect(res.status()).toBe(400)
})

test('/api/clicks rejects count = 0 with 400', async ({ api }) => {
  const res = await api.post('/api/clicks', { ...auth(7106), data: { count: 0, nonce: randomUUID() } })
  expect(res.status()).toBe(400)
})

test('/api/clicks rejects negative count with 400', async ({ api }) => {
  const res = await api.post('/api/clicks', { ...auth(7107), data: { count: -3, nonce: randomUUID() } })
  expect(res.status()).toBe(400)
})

test('/api/clicks rejects non-integer count with 400', async ({ api }) => {
  const res = await api.post('/api/clicks', { ...auth(7108), data: { count: 2.5, nonce: randomUUID() } })
  expect(res.status()).toBe(400)
})

test('/api/clicks rejects an empty nonce with 400', async ({ api }) => {
  const res = await api.post('/api/clicks', { ...auth(7109), data: { count: 1, nonce: '' } })
  expect(res.status()).toBe(400)
})

test('/api/clicks treats a replayed nonce as an idempotent no-op', async ({ api }) => {
  const a = auth(7110)
  const nonce = randomUUID()
  const first = await (await api.post('/api/clicks', { ...a, data: { count: 3, nonce } })).json()
  expect(first.accepted).toBe(3)
  expect(first.clicks).toBe(3)
  await sleep(260)
  const replay = await (await api.post('/api/clicks', { ...a, data: { count: 3, nonce } })).json()
  expect(replay.accepted).toBe(0)
  expect(replay.clicks).toBe(3)
})

test('/api/clicks rate-limits an immediate second write with 429', async ({ api }) => {
  const a = auth(7111)
  const ok = await api.post('/api/clicks', { ...a, data: { count: 1, nonce: randomUUID() } })
  expect(ok.status()).toBe(200)
  const limited = await api.post('/api/clicks', { ...a, data: { count: 1, nonce: randomUUID() } })
  expect(limited.status()).toBe(429)
  const b = await limited.json()
  expect(b.error.code).toBe('RATE_LIMITED')
})
