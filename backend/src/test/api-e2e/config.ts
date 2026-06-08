export const TEST_BOT_TOKEN = 'test-bot-token:123'

export type Seed = { id: number; first_name: string; username?: string; clicks: number }

// Enough users to fill top-25 and verify that my rank is still returned outside the top.
export const seedUsers: Seed[] = Array.from({ length: 30 }, (_, i) => ({
  id: 1000 + i,
  first_name: `User${i}`,
  username: i % 2 === 0 ? `user${i}` : undefined,
  clicks: (30 - i) * 10,
}))

export { MAX_BATCH, ENERGY_MAX } from '../../../../shared/constants'
