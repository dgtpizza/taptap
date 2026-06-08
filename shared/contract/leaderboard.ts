export type LeaderboardEntry = {
  rank: number
  telegramId: number
  firstName: string
  lastName?: string
  username?: string
  clicks: number
}

export type LeaderboardResponse = {
  top: LeaderboardEntry[]
  me: { rank: number; clicks: number; telegramId: number }
}
