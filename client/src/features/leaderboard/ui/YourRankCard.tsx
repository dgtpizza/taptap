import { formatCount } from '@/shared/format'
import { keys, t } from '@/shared/i18n'

export function YourRankCard({ rank, clicks }: { rank: number; clicks: number }) {
  return (
    <div className="px-lg pt-md">
      <div
        data-testid="your-rank-card"
        className="flex h-16 w-full items-center gap-md rounded-card border border-accent bg-accent-soft px-lg"
      >
        <div className="flex h-6 items-center justify-center rounded-pill bg-accent px-2.5">
          <span className="text-[13px] font-bold text-on-accent">#{rank}</span>
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-accent">{t(keys.you)}</span>
          <span className="text-xs font-medium text-muted">{t(keys.yourCurrentPosition)}</span>
        </div>
        <span className="text-[17px] font-semibold text-ink tabular-nums">{formatCount(clicks)}</span>
      </div>
    </div>
  )
}
