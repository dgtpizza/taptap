import fastifyCors from '@fastify/cors'
import fp from 'fastify-plugin'

function parseOrigins(value: string): string[] | true {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  return origins.includes('*') ? true : origins
}

export default fp(
  async (app) => {
    const origins = parseOrigins(app.config.CORS_ORIGIN)
    if (origins !== true && origins.length === 0) return

    await app.register(fastifyCors, {
      origin: origins,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['authorization', 'content-type'],
    })
  },
  { name: 'cors', dependencies: ['env'] },
)
