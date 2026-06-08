import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MongoDBContainer, type StartedMongoDBContainer } from '@testcontainers/mongodb'
import { connectDb, type DbHandle } from '@/core/db'
import { applyClicks } from '@/modules/clicker/service'

describe('Clicker (Mongo)', () => {
  let mongo: StartedMongoDBContainer
  let db: DbHandle

  beforeAll(async () => {
    mongo = await new MongoDBContainer('mongo:7').start()
    db = await connectDb(`${mongo.getConnectionString()}?directConnection=true`, 'cc_clicker_contract')
  })

  afterAll(async () => {
    await db?.connection.close()
    await mongo?.stop()
  })

  it('does not move energyAt forward when no clicks are accepted', async () => {
    const energyAt = new Date(Date.now() + 60_000)
    const now = new Date()
    await db.User.create({
      _id: 500,
      firstName: 'Empty',
      clicks: 0,
      energy: 0,
      energyAt,
      createdAt: now,
      lastVisitedAt: now,
    })

    const updated = await applyClicks(db.User, 500, 1, 'empty-1')

    expect(updated.clicks).toBe(0)
    expect(updated.energy).toBe(0)
    expect(updated.lastAccepted).toBe(0)
    expect(updated.energyAt.getTime()).toBe(energyAt.getTime())
  })

  it('ignores a replayed nonce so a retried batch is not counted twice', async () => {
    const now = new Date()
    await db.User.create({
      _id: 600,
      firstName: 'Retry',
      clicks: 0,
      energy: 100,
      energyAt: now,
      createdAt: now,
      lastVisitedAt: now,
    })

    const first = await applyClicks(db.User, 600, 5, 'batch-A')
    expect(first.clicks).toBe(5)
    expect(first.lastAccepted).toBe(5)
    const energyAfterFirst = first.energy

    const replay = await applyClicks(db.User, 600, 5, 'batch-A')
    expect(replay.clicks).toBe(5)
    expect(replay.lastAccepted).toBe(0)
    expect(replay.energy).toBe(energyAfterFirst)

    const next = await applyClicks(db.User, 600, 5, 'batch-B')
    expect(next.clicks).toBe(10)
    expect(next.lastAccepted).toBe(5)
  })

  it('ignores a replayed nonce even after another batch was accepted', async () => {
    const now = new Date()
    await db.User.create({
      _id: 601,
      firstName: 'OldRetry',
      clicks: 0,
      energy: 100,
      energyAt: now,
      createdAt: now,
      lastVisitedAt: now,
    })

    await applyClicks(db.User, 601, 5, 'batch-A')
    await applyClicks(db.User, 601, 2, 'batch-B')
    const replay = await applyClicks(db.User, 601, 5, 'batch-A')

    expect(replay.clicks).toBe(7)
    expect(replay.lastAccepted).toBe(0)
  })

  it('counts concurrent requests with the same nonce only once', async () => {
    const now = new Date()
    await db.User.create({
      _id: 602,
      firstName: 'RaceRetry',
      clicks: 0,
      energy: 100,
      energyAt: now,
      createdAt: now,
      lastVisitedAt: now,
    })

    const results = await Promise.all([
      applyClicks(db.User, 602, 7, 'batch-race'),
      applyClicks(db.User, 602, 7, 'batch-race'),
      applyClicks(db.User, 602, 7, 'batch-race'),
    ])

    const fresh = await db.User.findById(602).lean()

    expect(fresh?.clicks).toBe(7)
    expect(results.reduce((sum, doc) => sum + (doc.lastAccepted ?? 0), 0)).toBe(7)
    expect(fresh?.recentNonces?.filter((nonce) => nonce === 'batch-race')).toHaveLength(1)
  })
})
