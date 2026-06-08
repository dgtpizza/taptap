import { randomUUID } from 'node:crypto'
import { test, expect } from './fixtures'
import { signInitData } from '../helpers/initData'
import { TEST_BOT_TOKEN, MAX_BATCH } from './config'

const auth = (id: number) => ({
  headers: { authorization: `tma ${signInitData({ id, first_name: `C${id}` }, TEST_BOT_TOKEN)}` },
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

test('GET /me returns clicks and energy', async ({ api }) => {
  const me = await (await api.get('/api/me', auth(7004))).json()
  expect(me.telegramId).toBe(7004)
  expect(me.clicks).toBe(0)
  expect(me.energy).toBeGreaterThan(0)
  expect(me.energyMax).toBeGreaterThan(0)
})

test('counts a batch of clicks', async ({ api }) => {
  const res = await api.post('/api/clicks', { ...auth(7001), data: { count: 5, nonce: randomUUID() } })
  expect(res.status()).toBe(200)
  const b = await res.json()
  expect(b.accepted).toBe(5)
  expect(b.clicks).toBe(5)
})

test('rejects batch over MAX_BATCH', async ({ api }) => {
  const res = await api.post('/api/clicks', { ...auth(7002), data: { count: MAX_BATCH + 1, nonce: randomUUID() } })
  expect(res.status()).toBe(400)
})

test('rejects batch without a nonce', async ({ api }) => {
  const res = await api.post('/api/clicks', { ...auth(7005), data: { count: 1 } })
  expect(res.status()).toBe(400)
})

test('rejects a body larger than the limit with 413, not 500', async ({ api }) => {
  const res = await api.post('/api/clicks', {
    ...auth(7012),
    data: { count: 1, nonce: randomUUID(), pad: 'A'.repeat(5000) },
  })
  expect(res.status()).toBe(413)
})

test('strips harmless extra fields from the click body contract', async ({ api }) => {
  const res = await api.post('/api/clicks', {
    ...auth(7014),
    data: { count: 1, nonce: randomUUID(), clicks: 999, energy: 999 },
  })
  expect(res.status()).toBe(200)
  const b = await res.json()
  expect(b.accepted).toBe(1)
  expect(b.clicks).toBe(1)
})

test('rejects malformed JSON with 400, not 500', async ({ api }) => {
  const res = await api.post('/api/clicks', {
    headers: { ...auth(7013).headers, 'content-type': 'application/json' },
    data: '{not valid json',
  })
  expect(res.status()).toBe(400)
})

test('rate-limits click write spam per user', async ({ api }) => {
  const a = auth(7010)
  expect((await api.post('/api/clicks', { ...a, data: { count: 1, nonce: randomUUID() } })).status()).toBe(200)
  expect((await api.post('/api/clicks', { ...a, data: { count: 1, nonce: randomUUID() } })).status()).toBe(429)
})

test('ignores a replayed nonce so a retried batch is not counted twice', async ({ api }) => {
  const a = auth(7011)
  const nonce = randomUUID()
  const first = await (await api.post('/api/clicks', { ...a, data: { count: 3, nonce } })).json()
  expect(first.accepted).toBe(3)
  expect(first.clicks).toBe(3)
  const replay = await (await api.post('/api/clicks', { ...a, data: { count: 3, nonce } })).json()
  expect(replay.accepted).toBe(0)
  expect(replay.clicks).toBe(3)
})

test('clamps to available energy when drained', async ({ api }) => {
  const a = auth(7003)
  let drained = false
  for (let i = 0; i < 30; i++) {
    const b = await (await api.post('/api/clicks', { ...a, data: { count: MAX_BATCH, nonce: randomUUID() } })).json()
    expect(b.energy).toBeGreaterThanOrEqual(0)
    if (b.accepted < MAX_BATCH) {
      drained = true
      break
    }
    await sleep(260)
  }
  expect(drained).toBe(true)
})
