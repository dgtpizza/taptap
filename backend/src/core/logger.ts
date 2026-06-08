import type { FastifyServerOptions } from 'fastify'

export function loggerOptions(): FastifyServerOptions['logger'] {
  if (process.env.NODE_ENV === 'test') return false

  return {
    level: process.env.LOG_LEVEL ?? 'info',
    redact: ['req.headers.authorization'],
  }
}
