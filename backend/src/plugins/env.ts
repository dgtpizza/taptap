import fp from 'fastify-plugin'
import fastifyEnv from '@fastify/env'
import { Type, type Static } from '@sinclair/typebox'

const schema = Type.Object({
  PORT: Type.Number({ default: 3000 }),
  LOG_LEVEL: Type.String({ default: 'info' }),
  CORS_ORIGIN: Type.String({ default: '' }),
  BODY_LIMIT_BYTES: Type.Number({ default: 4096 }),
  SHUTDOWN_DELAY_MS: Type.Number({ default: 1000 }),

  BOT_TOKEN: Type.String(),
  PROFILE_SYNC_MS: Type.Number({ default: 60_000 }),

  CLICK_RATE_LIMIT_MS: Type.Number({ default: 250 }),
  LEADERBOARD_RATE_LIMIT_MS: Type.Number({ default: 1000 }),

  MONGODB_URI: Type.String(),
  MONGODB_DB: Type.String({ default: 'cryptoclicker' }),
  MONGODB_MAX_POOL_SIZE: Type.Number({ default: 20 }),
  MONGODB_MIN_POOL_SIZE: Type.Number({ default: 2 }),
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: Type.Number({ default: 5000 }),
  MONGODB_SOCKET_TIMEOUT_MS: Type.Number({ default: 45000 }),
})

export type AppConfig = Static<typeof schema>

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig
  }
}

export default fp(
  async (app) => {
    await app.register(fastifyEnv, { schema, dotenv: true })
  },
  { name: 'env' },
)
