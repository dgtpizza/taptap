import type { ReactNode } from 'react'
import { ClickerProvider } from '@/features/clicker/ClickerProvider'
import { LeaderboardProvider } from '@/features/leaderboard/LeaderboardProvider'

export function StoreProvider({ children }: { children: ReactNode }) {
  return (
    <ClickerProvider>
      <LeaderboardProvider>{children}</LeaderboardProvider>
    </ClickerProvider>
  )
}
