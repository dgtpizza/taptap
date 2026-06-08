import type { LeaderboardEntry } from '@shared/contract'
import { avatarColor } from '@/shared/ui/avatar'
import { formatCount } from '@/shared/format'
import { keys, t } from '@/shared/i18n'

export function LeaderboardRow({
  entry,
  isMe,
  showDivider,
}: {
  entry: LeaderboardEntry
  isMe: boolean
  showDivider: boolean
}) {
  return (
    <div
      data-testid="leaderboard-row"
      className={`relative flex h-14 w-full items-center gap-md px-lg${isMe ? ' border border-accent bg-accent-soft' : ''}`}
    >
      <span
        data-testid="row-rank"
        className={`w-6 text-[15px] font-semibold tabular-nums${isMe ? ' text-accent' : ' text-muted'}`}
      >
        {entry.rank}
      </span>
      <span
        className="h-9 w-9 shrink-0 rounded-pill"
        style={{ background: isMe ? '#3390EC' : avatarColor(String(entry.telegramId)) }}
      />
      <span
        data-testid="row-name"
        className={`min-w-0 flex-1 truncate text-[15px]${isMe ? ' font-semibold text-accent' : ' font-medium text-ink'}`}
      >
        {isMe ? t(keys.you) : entry.firstName}
      </span>
      <span
        data-testid="row-clicks"
        className={`text-[15px] font-semibold tabular-nums${isMe ? ' text-accent' : ' text-ink'}`}
      >
        {formatCount(entry.clicks)}
      </span>
      {showDivider && !isMe && (
        <span data-testid="row-divider" className="absolute bottom-0 left-16 right-0 h-px bg-border-subtle" />
      )}
    </div>
  )
}
