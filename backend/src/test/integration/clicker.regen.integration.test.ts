import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MongoDBContainer, type StartedMongoDBContainer } from '@testcontainers/mongodb'
import { ENERGY_MAX, REGEN_PER_SEC } from '@shared/constants'
import { connectDb, type DbHandle } from '@/core/db'
import { applyClicks } from '@/modules/clicker/service'

// These tests move energyAt around because applyClicks uses the server-side $$NOW value.
describe('Clicker regen & spend (Mongo)', () => {
  let mongo: StartedMongoDBContainer
  let db: DbHandle

  beforeAll(async () => {
    mongo = await new MongoDBContainer('mongo:7').start()
    db = await connectDb(`${mongo.getConnectionString()}?directConnection=true`, 'cc_clicker_regen')
  })

  afterAll(async () => {
    await db?.connection.close()
    await mongo?.stop()
  })

  const seed = async (id: number, fields: Partial<{ clicks: number; energy: number; energyAt: Date }>) => {
    const now = new Date()
    await db.User.create({
      _id: id,
      firstName: `U${id}`,
      clicks: fields.clicks ?? 0,
      energy: fields.energy ?? 0,
      energyAt: fields.energyAt ?? now,
      createdAt: now,
      lastVisitedAt: now,
    })
  }

  it('regenerates energy before spending clicks', async () => {
    await seed(1100, { energy: 0, energyAt: new Date(Date.now() - 100_000) })
    const res = await applyClicks(db.User, 1100, 5, 'regen-1')
    expect(res.lastAccepted).toBe(5)
    expect(res.clicks).toBe(5)
    // Allow a small delta for the time spent by the test itself.
    expect(res.energy).toBeGreaterThanOrEqual(ENERGY_MAX - 5 - REGEN_PER_SEC)
    expect(res.energy).toBeLessThanOrEqual(ENERGY_MAX)
  })

  it('clamps regeneration to ENERGY_MAX for an old energyAt', async () => {
    await seed(1101, { energy: 0, energyAt: new Date(Date.now() - 3_600_000) })
    const res = await applyClicks(db.User, 1101, 1, 'regen-cap')
    expect(res.lastAccepted).toBe(1)
    expect(res.energy).toBe(ENERGY_MAX - 1)
  })

  it('spends energy when clicks are accepted', async () => {
    await seed(1102, { energy: 80, energyAt: new Date() })
    const res = await applyClicks(db.User, 1102, 10, 'spend-1')
    expect(res.lastAccepted).toBe(10)
    expect(res.clicks).toBe(10)
    expect(res.energy).toBeGreaterThanOrEqual(70)
    expect(res.energy).toBeLessThan(80)
  })

  it('clamps accepted clicks to available energy', async () => {
    await seed(1103, { energy: 3, energyAt: new Date() })
    const res = await applyClicks(db.User, 1103, 60, 'clamp-1')
    expect(res.lastAccepted).toBe(3)
    expect(res.clicks).toBe(3)
    expect(res.energy).toBe(0)
  })

  it('keeps energyAt unchanged when zero clicks are accepted', async () => {
    const future = new Date(Date.now() + 120_000)
    await seed(1104, { energy: 0, energyAt: future })
    const res = await applyClicks(db.User, 1104, 5, 'zero-1')
    expect(res.lastAccepted).toBe(0)
    expect(res.clicks).toBe(0)
    expect(res.energy).toBe(0)
    expect(res.energyAt.getTime()).toBe(future.getTime())
  })

  it('keeps clicks, energy, and energyAt unchanged for a replayed nonce', async () => {
    await seed(1105, { energy: 100, energyAt: new Date() })
    const first = await applyClicks(db.User, 1105, 7, 'idem-A')
    expect(first.lastAccepted).toBe(7)
    const energyAfter = first.energy
    const energyAtAfter = first.energyAt.getTime()

    const replay = await applyClicks(db.User, 1105, 7, 'idem-A')
    expect(replay.lastAccepted).toBe(0)
    expect(replay.clicks).toBe(7)
    expect(replay.energy).toBe(energyAfter)
    expect(replay.energyAt.getTime()).toBe(energyAtAfter)
  })

  it('accepts the next new nonce after a replay', async () => {
    await seed(1106, { energy: 100, energyAt: new Date() })
    await applyClicks(db.User, 1106, 4, 'seq-A')
    await applyClicks(db.User, 1106, 4, 'seq-A')
    const third = await applyClicks(db.User, 1106, 6, 'seq-B')
    expect(third.lastAccepted).toBe(6)
    expect(third.clicks).toBe(10)
  })

  it('accumulates clicks across sequential batches with distinct nonces', async () => {
    await seed(1107, { energy: 50, energyAt: new Date() })
    let total = 0
    for (let i = 0; i < 5; i++) {
      const r = await applyClicks(db.User, 1107, 3, `acc-${i}`)
      total += 3
      expect(r.clicks).toBe(total)
      expect(r.lastAccepted).toBe(3)
    }
    expect(total).toBe(15)
  })

  it('rejects a missing user without upsert', async () => {
    await expect(applyClicks(db.User, 999_999, 1, 'ghost')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })
})
