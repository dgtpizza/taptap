import type { RateLimitModel } from '@/core/db'
import { AppError } from '@/core/errors'

const DUPLICATE_KEY = 11000

// Distributed fixed-interval limiter: a key passes at most once per window.
// Upsert on "window expired or absent"; a duplicate _id means the window is still
// open, so concurrent callers across instances are rejected with 429.
export function createRateLimiter(model: RateLimitModel, windowMs: number) {
  return {
    async assertAllowed(key: string, now: Date = new Date()): Promise<void> {
      try {
        await model.updateOne(
          { _id: key, expireAt: { $lte: now } },
          { $set: { expireAt: new Date(now.getTime() + windowMs) } },
          { upsert: true },
        )
      } catch (err) {
        if (isDuplicateKey(err)) throw new AppError('RATE_LIMITED', 'Too many requests', 429)
        throw err
      }
    },
  }
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === DUPLICATE_KEY
}
