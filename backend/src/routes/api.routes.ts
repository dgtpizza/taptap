import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { clickerRoutes } from '@/modules/clicker/routes'
import { leaderboardRoutes } from '@/modules/leaderboard/routes'

export const apiRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.addHook('preHandler', app.authenticate)
  app.setNotFoundHandler((_req, reply) => {
    return reply.code(404).send({ error: { code: 'VALIDATION', message: 'Not found' } })
  })

  await app.register(clickerRoutes)
  await app.register(leaderboardRoutes)
}
