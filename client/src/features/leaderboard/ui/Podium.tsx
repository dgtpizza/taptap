import type { LeaderboardEntry } from '@shared/contract'
import { avatarGradient, initialOf } from '@/shared/ui/avatar'
import { formatCount } from '@/shared/format'
import { CrownIcon } from '@/shared/ui/icons'
import { PodiumAvatar } from '@/features/leaderboard/ui/PodiumAvatar'
import { PodiumStarBurst } from '@/features/leaderboard/ui/PodiumStarBurst'

function GoldColumn({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-rank-gold">
        <CrownIcon size={22} />
      </span>
      <PodiumAvatar
        size={88}
        gradient="linear-gradient(135deg,#FFE17A,#C8881C)"
        ringWidth={3}
        ringClassName="ring-rank-gold"
        initial={initialOf(entry.firstName)}
        initialClassName="text-[32px] text-gold-shadow"
        badge={1}
        badgeClassName="w-7 h-7 bg-rank-gold text-[13px]"
        username={entry.username}
      />
      <span className="text-[15px] font-semibold text-ink">{entry.firstName}</span>
      <span className="text-[15px] font-bold text-rank-gold tabular-nums">
        {formatCount(entry.clicks)}
      </span>
      <div
        className="h-[130px] w-[clamp(90px,29vw,112px)] rounded-t-[12px]"
        style={{ background: 'linear-gradient(to bottom,#F5C24A,var(--color-surface))' }}
      />
    </div>
  )
}

function SilverColumn({ entry }: { entry: LeaderboardEntry }) {
  const seed = String(entry.telegramId)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <PodiumAvatar
        size={64}
        gradient={avatarGradient(seed)}
        ringWidth={2.5}
        ringClassName="ring-rank-silver"
        initial={initialOf(entry.firstName)}
        initialClassName="text-[24px] text-ink"
        badge={2}
        badgeClassName="w-6 h-6 bg-rank-silver text-[12px]"
        username={entry.username}
      />
      <span className="text-[14px] font-semibold text-ink">{entry.firstName}</span>
      <span className="text-[13px] font-semibold text-muted tabular-nums">
        {formatCount(entry.clicks)}
      </span>
      <div
        className="h-[80px] w-[clamp(82px,27vw,104px)] rounded-t-[12px]"
        style={{ background: 'linear-gradient(to bottom,#C0C8D4,var(--color-surface))' }}
      />
    </div>
  )
}

function BronzeColumn({ entry }: { entry: LeaderboardEntry }) {
  const seed = String(entry.telegramId)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <PodiumAvatar
        size={64}
        gradient={avatarGradient(seed)}
        ringWidth={2.5}
        ringClassName="ring-rank-bronze"
        initial={initialOf(entry.firstName)}
        initialClassName="text-[24px] text-ink"
        badge={3}
        badgeClassName="w-6 h-6 bg-rank-bronze text-[12px]"
        username={entry.username}
      />
      <span className="text-[14px] font-semibold text-ink">{entry.firstName}</span>
      <span className="text-[13px] font-semibold text-muted tabular-nums">
        {formatCount(entry.clicks)}
      </span>
      <div
        className="h-[45px] w-[clamp(82px,27vw,104px)] rounded-t-[12px]"
        style={{ background: 'linear-gradient(to bottom,#D88A4E,var(--color-surface))' }}
      />
    </div>
  )
}

export function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const gold = entries[0]
  const silver = entries[1]
  const bronze = entries[2]

  return (
    <div className="px-md sm:px-lg">
      <div className="relative overflow-hidden rounded-card bg-surface px-md pt-2xl leading-[1.2] sm:px-lg">
        <div className="absolute left-[78px] top-[12px] h-[180px] w-[180px] rounded-full bg-gold-glow opacity-50 blur-[40px]" />
        <PodiumStarBurst />
        <div className="relative z-10 flex items-end justify-center gap-[clamp(6px,2vw,14px)]">
          {silver ? <SilverColumn entry={silver} /> : <div className="w-[clamp(82px,27vw,104px)]" />}
          {gold ? <GoldColumn entry={gold} /> : <div className="w-[clamp(90px,29vw,112px)]" />}
          {bronze ? <BronzeColumn entry={bronze} /> : <div className="w-[clamp(82px,27vw,104px)]" />}
        </div>
      </div>
    </div>
  )
}
