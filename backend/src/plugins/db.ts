import fp from 'fastify-plugin'
import { connectDb, type DbHandle } from '@/core/db'

declare module 'fastify' {
  interface FastifyInstance {
    db: DbHandle
  }
}

export default fp(
  async (app) => {
    const db = await connectDb(app.config.MONGODB_URI, app.config.MONGODB_DB, {
      maxPoolSize: app.config.MONGODB_MAX_POOL_SIZE,
      minPoolSize: app.config.MONGODB_MIN_POOL_SIZE,
      serverSelectionTimeoutMS: app.config.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
      socketTimeoutMS: app.config.MONGODB_SOCKET_TIMEOUT_MS,
    })
    app.decorate('db', db)
    app.addHook('onClose', async () => {
      await db.connection.close()
    })
  },
  { name: 'db', dependencies: ['env'] },
)
