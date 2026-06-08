import fp from 'fastify-plugin'
import type { FastifyRequest } from 'fastify'
import { ENERGY_MAX } from '@shared/constants'
import { validateInitData, type TgUser } from '@/core/auth'
import { unauthorized } from '@/core/errors'

declare module 'fastify' {
  interface FastifyRequest {
    user: TgUser
  }
  interface FastifyInstance {
    authenticate: (req: FastifyRequest) => Promise<void>
  }
}

export default fp(
  async (app) => {
    // Throttle profile upserts: refresh a user's Telegram fields at most once per window.
    const profileSyncMs = app.config.PROFILE_SYNC_MS
    const profileCleanupTtlMs = profileSyncMs * 5
    const lastProfileSync = new Map<number, number>()
    let nextProfileCleanupAt = 0

    app.decorate('authenticate', async (req: FastifyRequest) => {
      const header = req.headers.authorization
      const initData = header?.startsWith('tma ') ? header.slice(4) : undefined

      if (!initData) throw unauthorized('No initData')

      const user = validateInitData(initData, app.config.BOT_TOKEN)
      const now = new Date()
      const nowMs = now.getTime()

      if (nowMs >= nextProfileCleanupAt) {
        for (const [userId, lastSyncAt] of lastProfileSync) {
          if (nowMs - lastSyncAt > profileCleanupTtlMs) lastProfileSync.delete(userId)
        }
        nextProfileCleanupAt = nowMs + profileCleanupTtlMs
      }

      const lastSync = lastProfileSync.get(user.telegramId) ?? 0

      if (nowMs - lastSync < profileSyncMs) {
        req.user = user
        return
      }

      const set: Record<string, unknown> = { firstName: user.firstName, lastVisitedAt: now }
      const unset: Record<string, ''> = {}

      if (user.username !== undefined) set.username = user.username
      else unset.username = ''

      if (user.lastName !== undefined) set.lastName = user.lastName
      else unset.lastName = ''

      await app.db.User.updateOne(
        { _id: user.telegramId },
        { $setOnInsert: { clicks: 0, energy: ENERGY_MAX, energyAt: now, createdAt: now }, $set: set, $unset: unset },
        { upsert: true },
      )

      lastProfileSync.set(user.telegramId, nowMs)
      req.user = user
    })
  },
  { name: 'auth', dependencies: ['env', 'db'] },
)
