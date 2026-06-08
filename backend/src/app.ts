import Fastify, { type FastifyInstance } from 'fastify'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { registerErrorHandler } from '@/core/errors'
import { loggerOptions } from '@/core/logger'
import env from '@/plugins/env'
import cors from '@/plugins/cors'
import db from '@/plugins/db'
import auth from '@/plugins/auth'
import { apiRoutes } from '@/routes/api.routes'
import { healthRoutes } from '@/routes/health.routes'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: loggerOptions() }).withTypeProvider<TypeBoxTypeProvider>()
  registerErrorHandler(app)

  await app.register(env)
  await app.register(cors)
  await app.register(db)
  await app.register(auth)

  await app.register(healthRoutes)
  await app.register(apiRoutes, { prefix: '/api' })

  return app
}
