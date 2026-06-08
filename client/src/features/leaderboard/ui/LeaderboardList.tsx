import type { LeaderboardEntry } from '@shared/contract'
import { LeaderboardRow } from '@/features/leaderboard/ui/LeaderboardRow'

export function LeaderboardList({
  entries,
  meId,
}: {
  entries: LeaderboardEntry[]
  meId: number
}) {
  return (
    <div className="px-lg pb-md">
      <div className="overflow-hidden rounded-card bg-surface">
        {entries.map((entry, i) => (
          <LeaderboardRow
            key={entry.telegramId}
            entry={entry}
            isMe={entry.telegramId === meId}
            showDivider={i < entries.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
