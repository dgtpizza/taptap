import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MongoDBContainer, type StartedMongoDBContainer } from '@testcontainers/mongodb'
import { connectDb, type DbHandle } from '@/core/db'
import { createRateLimiter } from '@/core/rate-limit'

describe('Rate limiter (Mongo)', () => {
  let mongo: StartedMongoDBContainer
  let db: DbHandle

  beforeAll(async () => {
    mongo = await new MongoDBContainer('mongo:7').start()
    db = await connectDb(`${mongo.getConnectionString()}?directConnection=true`, 'cc_ratelimit')
  })

  afterAll(async () => {
    await db?.connection.close()
    await mongo?.stop()
  })

  it('allows the first call and blocks a second within the window', async () => {
    const rl = createRateLimiter(db.RateLimit, 250)
    const t0 = new Date()
    await rl.assertAllowed('clicks:1', t0)
    await expect(rl.assertAllowed('clicks:1', new Date(t0.getTime() + 100))).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      status: 429,
    })
  })

  it('allows again once the window has passed', async () => {
    const rl = createRateLimiter(db.RateLimit, 250)
    const t0 = new Date()
    await rl.assertAllowed('clicks:2', t0)
    await expect(rl.assertAllowed('clicks:2', new Date(t0.getTime() + 250))).resolves.toBeUndefined()
  })

  it('is independent per key', async () => {
    const rl = createRateLimiter(db.RateLimit, 250)
    const t0 = new Date()
    await rl.assertAllowed('clicks:3', t0)
    await expect(rl.assertAllowed('clicks:4', t0)).resolves.toBeUndefined()
  })

  it('rejects exactly one of two concurrent calls (distributed safety)', async () => {
    const rl = createRateLimiter(db.RateLimit, 1000)
    const now = new Date()
    const settled = await Promise.allSettled([
      rl.assertAllowed('clicks:5', now),
      rl.assertAllowed('clicks:5', now),
    ])
    expect(settled.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    expect(settled.filter((r) => r.status === 'rejected')).toHaveLength(1)
  })
})
