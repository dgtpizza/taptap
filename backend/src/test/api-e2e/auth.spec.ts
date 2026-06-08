import { test, expect } from './fixtures'
import { signInitData } from '../helpers/initData'
import { TEST_BOT_TOKEN } from './config'

test('rejects missing initData', async ({ api }) => {
  const res = await api.get('/api/me')
  expect(res.status()).toBe(401)
})

test('rejects bad signature', async ({ api }) => {
  const bad = signInitData({ id: 9001, first_name: 'X' }, 'wrong-token')
  const res = await api.get('/api/me', { headers: { authorization: `tma ${bad}` } })
  expect(res.status()).toBe(401)
})

test('rejects expired initData', async ({ api }) => {
  const old = signInitData({ id: 9003, first_name: 'Old' }, TEST_BOT_TOKEN, 1000)
  const res = await api.get('/api/me', { headers: { authorization: `tma ${old}` } })
  expect(res.status()).toBe(401)
})

test('accepts valid initData and creates profile', async ({ api }) => {
  const init = signInitData({ id: 9002, first_name: 'New' }, TEST_BOT_TOKEN)
  const res = await api.get('/api/me', { headers: { authorization: `tma ${init}` } })
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.telegramId).toBe(9002)
  expect(body.clicks).toBe(0)
  expect(body.energyMax).toBeGreaterThan(0)
})
