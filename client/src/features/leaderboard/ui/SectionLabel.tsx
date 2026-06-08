import { LEADERBOARD_LIMIT } from '@shared/constants'
import { keys, t } from '@/shared/i18n'
import { ChevronDownIcon } from '@/shared/ui/icons'

export function SectionLabel() {
  return (
    <div className="flex items-center justify-between px-lg pb-sm pt-[14px]">
      <span className="text-xs font-semibold uppercase tracking-[0.8px] text-faint">
        {t(keys.topN, { n: LEADERBOARD_LIMIT })}
      </span>
      <div className="flex items-center gap-xs">
        <span className="text-xs text-faint">{t(keys.sortClicks)}</span>
        <span className="text-faint">
          <ChevronDownIcon size={14} />
        </span>
      </div>
    </div>
  )
}
