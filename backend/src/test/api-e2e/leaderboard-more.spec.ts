import { test, expect } from './fixtures'
import { signInitData } from '../helpers/initData'
import { TEST_BOT_TOKEN } from './config'

const auth = (id: number, first = 'P') => ({
  headers: { authorization: `tma ${signInitData({ id, first_name: first }, TEST_BOT_TOKEN)}` },
})

type Entry = { rank: number; telegramId: number; clicks: number; firstName: string }

test('/api/leaderboard: top is capped at 25, desc sorted, and ranked from 1', async ({ api }) => {
  const res = await api.get('/api/leaderboard', auth(7201, 'Lead'))
  expect(res.status()).toBe(200)
  const b = await res.json()
  expect(b.top.length).toBe(25)
  const clicks = b.top.map((e: Entry) => e.clicks)
  expect(clicks).toEqual([...clicks].sort((x: number, y: number) => y - x))
  expect(b.top[0].rank).toBe(1)
  const ranks = b.top.map((e: Entry) => e.rank)
  for (let i = 1; i < ranks.length; i++) expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1])
})

test('/api/leaderboard: me.telegramId is present and matches the current user', async ({ api }) => {
  const res = await api.get('/api/leaderboard', auth(7202, 'Self'))
  const b = await res.json()
  expect(b.me).toBeDefined()
  expect(b.me.telegramId).toBe(7202)
  expect(typeof b.me.rank).toBe('number')
  expect(typeof b.me.clicks).toBe('number')
})

test('/api/leaderboard: user outside top sees me.rank > 25', async ({ api }) => {
  const res = await api.get('/api/leaderboard', auth(7203, 'Outsider'))
  const b = await res.json()
  expect(b.me.clicks).toBe(0)
  expect(b.me.rank).toBeGreaterThan(25)
})

test('/api/leaderboard: user in top is present with own telegramId', async ({ api }) => {
  // Avoid asserting an exact rank because other specs share this seeded database.
  const res = await api.get('/api/leaderboard', auth(1000, 'TopSeed'))
  const b = await res.json()
  const mine = b.top.find((e: Entry) => e.telegramId === 1000)
  expect(mine).toBeDefined()
  expect(b.me.telegramId).toBe(1000)
  expect(b.me.clicks).toBe(mine.clicks)
  expect(b.me.rank).toBe(mine.rank)
  expect(b.me.rank).toBeLessThanOrEqual(25)
})

test('/api/leaderboard: top entries include required fields', async ({ api }) => {
  const res = await api.get('/api/leaderboard', auth(7204, 'Fields'))
  const b = await res.json()
  for (const e of b.top as Entry[]) {
    expect(typeof e.rank).toBe('number')
    expect(typeof e.telegramId).toBe('number')
    expect(typeof e.firstName).toBe('string')
    expect(typeof e.clicks).toBe('number')
  }
})

test('/api/leaderboard: a repeated read from the same user is rate-limited', async ({ api }) => {
  const a = auth(7299, 'Limited')
  expect((await api.get('/api/leaderboard', a)).status()).toBe(200)
  expect((await api.get('/api/leaderboard', a)).status()).toBe(429)
})
