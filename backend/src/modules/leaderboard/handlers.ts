import type { FastifyInstance, FastifyRequest } from 'fastify'
import { LEADERBOARD_CACHE_MS, LEADERBOARD_LIMIT } from '@shared/constants'
import type { LeaderboardEntry, LeaderboardResponse } from '@shared/contract'
import type { UserDoc } from '@/core/db'
import { createRateLimiter } from '@/core/rate-limit'
import { rankOf, topClickers, type TopEntry } from '@/modules/leaderboard/service'

export function createLeaderboardHandlers(app: FastifyInstance) {
  const leaderboardLimiter = createRateLimiter(app.db.RateLimit, app.config.LEADERBOARD_RATE_LIMIT_MS)
  let topCache: { expiresAt: number; entries: TopEntry[] } | null = null

  const readTop = async (fresh = false): Promise<TopEntry[]> => {
    const now = Date.now()
    if (!fresh && topCache && topCache.expiresAt > now) return topCache.entries
    const entries = await topClickers(app.db.User, LEADERBOARD_LIMIT)
    topCache = { entries, expiresAt: now + LEADERBOARD_CACHE_MS }
    return entries
  }

  const buildTop = (entries: TopEntry[]): LeaderboardEntry[] => {
    const rankByClicks = new Map<number, number>()
    return entries.map((e, i) => {
      if (!rankByClicks.has(e.clicks)) rankByClicks.set(e.clicks, i + 1)
      return {
        rank: rankByClicks.get(e.clicks) ?? i + 1,
        telegramId: e._id,
        firstName: e.firstName,
        lastName: e.lastName,
        username: e.username,
        clicks: e.clicks,
      }
    })
  }

  return {
    getLeaderboard: async (req: FastifyRequest): Promise<LeaderboardResponse> => {
      await leaderboardLimiter.assertAllowed(`leaderboard:${req.user.telegramId}`)
      const meId = req.user.telegramId
      let top = buildTop(await readTop())
      let me = top.find((e) => e.telegramId === meId)

      if (!me) {
        const meDoc = await app.db.User.findOne({ _id: meId }, { clicks: 1 }).lean<UserDoc | null>()
        const meClicks = meDoc?.clicks ?? 0
        const rank = await rankOf(app.db.User, meClicks)
        if (rank <= LEADERBOARD_LIMIT) {
          // Stale cache: me actually belongs in the top, so refresh it for a consistent list+rank.
          top = buildTop(await readTop(true))
          me = top.find((e) => e.telegramId === meId)
        }
        if (!me) return { top, me: { rank, clicks: meClicks, telegramId: meId } }
      }

      return { top, me: { rank: me.rank, clicks: me.clicks, telegramId: meId } }
    },
  }
}
