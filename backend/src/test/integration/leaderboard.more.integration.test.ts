import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MongoDBContainer, type StartedMongoDBContainer } from '@testcontainers/mongodb'
import { connectDb, type DbHandle } from '@/core/db'
import { rankOf, topClickers } from '@/modules/leaderboard/service'

describe('Leaderboard ranking & projection (Mongo)', () => {
  let mongo: StartedMongoDBContainer
  let db: DbHandle

  beforeAll(async () => {
    mongo = await new MongoDBContainer('mongo:7').start()
    db = await connectDb(`${mongo.getConnectionString()}?directConnection=true`, 'cc_lb_more')
    const now = new Date()
    const docs = Array.from({ length: 40 }, (_, i) => ({
      _id: 2000 + i,
      firstName: `Name${i}`,
      ...(i % 2 === 0 ? { username: `user${i}`, lastName: `Last${i}` } : {}),
      clicks: (40 - i) * 5,
      energy: 0,
      energyAt: now,
      createdAt: now,
      lastVisitedAt: now,
    }))
    docs.push({
      _id: 3000,
      firstName: 'TieA',
      username: 'tiea',
      lastName: 'LA',
      clicks: 999,
      energy: 0,
      energyAt: now,
      createdAt: now,
      lastVisitedAt: now,
    })
    docs.push({
      _id: 3001,
      firstName: 'TieB',
      clicks: 999,
      energy: 0,
      energyAt: now,
      createdAt: now,
      lastVisitedAt: now,
    })
    await db.User.insertMany(docs)
  })

  afterAll(async () => {
    await db?.connection.close()
    await mongo?.stop()
  })

  it('topClickers respects the limit', async () => {
    const top = await topClickers(db.User, 25)
    expect(top).toHaveLength(25)
  })

  it('topClickers sorts by clicks desc, then _id asc', async () => {
    const top = await topClickers(db.User, 10)
    const clicks = top.map((e) => e.clicks)
    expect(clicks).toEqual([...clicks].sort((a, b) => b - a))
    // Ties are ordered by _id for stable top lists.
    expect(top[0]?._id).toBe(3000)
    expect(top[1]?._id).toBe(3001)
    expect(top[0]?.clicks).toBe(999)
    expect(top[1]?.clicks).toBe(999)
  })

  it('topClickers returns the required projection', async () => {
    const top = await topClickers(db.User, 1)
    const e = top[0]
    expect(e).toMatchObject({
      _id: 3000,
      firstName: 'TieA',
      lastName: 'LA',
      username: 'tiea',
      clicks: 999,
    })
    // telegramId is mapped by the handler, not exposed by the DB projection.
    expect((e as Record<string, unknown>).telegramId).toBeUndefined()
  })

  it('omits username and lastName when they are missing', async () => {
    const top = await topClickers(db.User, 2)
    const tieB = top[1]
    expect(tieB?._id).toBe(3001)
    expect(tieB?.username).toBeUndefined()
    expect(tieB?.lastName).toBeUndefined()
  })

  it('rankOf returns 1 for the leader', async () => {
    expect(await rankOf(db.User, 999)).toBe(1)
  })

  it('rankOf returns the same rank for ties', async () => {
    const rank = await rankOf(db.User, 999)
    expect(rank).toBe(1)
  })

  it('rankOf counts all tied leaders above the next score', async () => {
    expect(await rankOf(db.User, 200)).toBe(3)
  })

  it('rankOf returns the last place rank', async () => {
    expect(await rankOf(db.User, 5)).toBe(42)
  })

  it('rankOf works for scores outside the top limit', async () => {
    const top = await topClickers(db.User, 25)
    const cutoff = top[24]?.clicks ?? 0
    const rank = await rankOf(db.User, cutoff - 1)
    expect(rank).toBeGreaterThan(25)
  })
})
