import type { FastifyInstance } from 'fastify'
import type { ErrorCode } from '@shared/contract'

export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number

  constructor(code: ErrorCode, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

export const unauthorized = (message = 'Invalid auth'): AppError =>
  new AppError('UNAUTHORIZED', message, 401)

type FrameworkError = {
  name?: string
  message?: string
  statusCode?: number
  validation?: unknown
}

function frameworkError(err: unknown): FrameworkError {
  return typeof err === 'object' && err !== null ? (err as FrameworkError) : { message: String(err) }
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.status).send({ error: { code: err.code, message: err.message } })
    }
    const e = frameworkError(err)
    const message = e.message ?? 'Validation error'
    if (e.validation || e.name === 'CastError' || e.name === 'ValidationError') {
      return reply.status(400).send({ error: { code: 'VALIDATION', message } })
    }
    // Preserve Fastify framework 4xx (malformed JSON, body too large, unsupported media) as-is
    // instead of masking them as 500.
    if (typeof e.statusCode === 'number' && e.statusCode >= 400 && e.statusCode < 500) {
      return reply.status(e.statusCode).send({ error: { code: 'VALIDATION', message } })
    }
    app.log.error(err)
    return reply.status(500).send({ error: { code: 'INTERNAL', message: 'Internal error' } })
  })
}
