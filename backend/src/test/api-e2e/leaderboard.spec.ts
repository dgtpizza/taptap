import { test, expect } from './fixtures'
import { signInitData } from '../helpers/initData'
import { TEST_BOT_TOKEN } from './config'

const auth = (id: number, first = 'P') => ({
  headers: { authorization: `tma ${signInitData({ id, first_name: first }, TEST_BOT_TOKEN)}` },
})

type Entry = { rank: number; clicks: number }

test('top is capped, sorted desc, ranked from 1', async ({ api }) => {
  const res = await api.get('/api/leaderboard', auth(1001, 'Alice'))
  expect(res.status()).toBe(200)
  const b = await res.json()
  expect(b.top.length).toBe(25)
  const clicks = b.top.map((e: Entry) => e.clicks)
  expect(clicks).toEqual([...clicks].sort((x, y) => y - x))
  expect(b.top[0].rank).toBe(1)
})

test('shows own rank even outside top-25', async ({ api }) => {
  const res = await api.get('/api/leaderboard', auth(8001, 'Zoe'))
  const b = await res.json()
  expect(b.me.clicks).toBe(0)
  expect(b.me.rank).toBeGreaterThan(25)
})
