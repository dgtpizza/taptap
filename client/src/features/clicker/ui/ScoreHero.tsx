import { formatCount } from '@/shared/format'
import { keys, t } from '@/shared/i18n'

export function ScoreHero({ value }: { value: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 pt-lg">
      <div
        data-testid="click-count"
        className="text-[72px] font-bold leading-none tracking-[-2px] tabular-nums text-ink"
        aria-live="polite"
      >
        {formatCount(value)}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-[1.6px] text-muted">
        {t(keys.totalClicks)}
      </div>
    </div>
  )
}
