import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MongoDBContainer, type StartedMongoDBContainer } from '@testcontainers/mongodb'
import { connectDb, type DbHandle } from '@/core/db'
import { rankOf, topClickers } from '@/modules/leaderboard/service'

describe('Leaderboard (Mongo)', () => {
  let mongo: StartedMongoDBContainer
  let db: DbHandle

  beforeAll(async () => {
    mongo = await new MongoDBContainer('mongo:7').start()
    db = await connectDb(`${mongo.getConnectionString()}?directConnection=true`, 'cc_contract')
    const now = new Date()
    await db.User.insertMany([
      { _id: 100, firstName: 'A', clicks: 30, energy: 0, energyAt: now, createdAt: now, lastVisitedAt: now },
      { _id: 200, firstName: 'B', clicks: 20, energy: 0, energyAt: now, createdAt: now, lastVisitedAt: now },
      { _id: 250, firstName: 'D', clicks: 20, energy: 0, energyAt: now, createdAt: now, lastVisitedAt: now },
      { _id: 300, firstName: 'C', clicks: 10, energy: 0, energyAt: now, createdAt: now, lastVisitedAt: now },
    ])
  })

  afterAll(async () => {
    await db?.connection.close()
    await mongo?.stop()
  })

  it('top sorted desc, rank consistent with order', async () => {
    const top = await topClickers(db.User, 2)
    expect(top.map((e) => e._id)).toEqual([100, 200])
    expect(top[0]?.clicks).toBe(30)
    expect(await rankOf(db.User, 30)).toBe(1)
    expect(await rankOf(db.User, 20)).toBe(2)
    expect(await rankOf(db.User, 10)).toBe(4)
  })
})
