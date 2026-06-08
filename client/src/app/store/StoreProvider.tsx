import type { ReactNode } from 'react'
import { ClickerProvider } from '@/features/clicker/ClickerProvider'
import { LeaderboardProvider } from '@/features/leaderboard/LeaderboardProvider'
import { SessionProvider } from '@/shared/session'

export function StoreProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ClickerProvider>
        <LeaderboardProvider>{children}</LeaderboardProvider>
      </ClickerProvider>
    </SessionProvider>
  )
}
