// Max clicks per request: one HTTP chunk, not the rate limit. The client splits a larger backlog
// across flushes, so this is buffer headroom; energy stays the real anti-cheat cap.
export const MAX_BATCH = 20

export const FLUSH_MS = 1000

export const ENERGY_TICK_MS = 250

export const RECENT_NONCE_LIMIT = 100
