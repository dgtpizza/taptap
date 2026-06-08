import type { LeaderboardResponse } from '@shared/contract'
import { LeaderboardList } from '@/features/leaderboard/ui/LeaderboardList'
import { Podium } from '@/features/leaderboard/ui/Podium'
import { SectionLabel } from '@/features/leaderboard/ui/SectionLabel'
import { YourRankCard } from '@/features/leaderboard/ui/YourRankCard'

export function LeaderboardReady({ data }: { data: LeaderboardResponse }) {
  return (
    <div className="flex h-full flex-col" data-testid="leaderboard-ready">
      <Podium entries={data.top.slice(0, 3)} />
      <YourRankCard rank={data.me.rank} clicks={data.me.clicks} />
      <SectionLabel />
      <div className="min-h-0 flex-1 overflow-y-auto pb-[var(--tabbar-clearance)]">
        <LeaderboardList entries={data.top.slice(3)} meId={data.me.telegramId} />
      </div>
    </div>
  )
}
