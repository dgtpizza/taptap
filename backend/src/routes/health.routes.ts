import type { FastifyPluginAsync } from 'fastify'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async (_req, reply) => {
    try {
      await app.db.connection.db?.admin().ping()
      return { ok: true }
    } catch {
      reply.code(503)
      return { ok: false }
    }
  })
}
