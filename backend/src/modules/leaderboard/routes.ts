import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import type { LeaderboardResponse } from '@shared/contract'
import { createLeaderboardHandlers } from '@/modules/leaderboard/handlers'
import { leaderboardRouteSchema } from '@/modules/leaderboard/schemas'

export const leaderboardRoutes: FastifyPluginAsyncTypebox = async (app) => {
  const handlers = createLeaderboardHandlers(app)

  app.get<{ Reply: LeaderboardResponse }>(
    '/leaderboard',
    { schema: leaderboardRouteSchema },
    handlers.getLeaderboard,
  )
}
