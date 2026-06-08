import { keys, t } from '@/shared/i18n'
import { TrophyIcon } from '@/shared/ui/icons'

const GHOST_ROWS = [0, 1, 2]

export function EmptyLeaderboard() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2xl px-2xl" data-testid="empty-leaderboard">
      <div className="flex h-[88px] w-[88px] items-center justify-center rounded-pill bg-surface-strong">
        <span className="text-muted">
          <TrophyIcon size={40} />
        </span>
      </div>

      <div className="flex flex-col items-center gap-sm">
        <h1 className="text-[20px] font-semibold text-ink">{t(keys.noPlayersYet)}</h1>
        <p className="max-w-[280px] text-center text-[15px] leading-[1.3] text-muted">{t(keys.emptyBody)}</p>
      </div>

      <div className="flex w-full flex-col gap-sm px-lg pt-sm opacity-[0.22]">
        {GHOST_ROWS.map((i) => (
          <div key={i} className="flex h-14 w-full items-center gap-md rounded-cell bg-surface px-[14px]">
            <span className="text-[13px] font-semibold text-faint">{i + 1}</span>
            <span className="h-9 w-9 shrink-0 rounded-pill border-[1.5px] border-faint" />
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="h-[9px] w-[120px] rounded bg-faint" />
              <span className="h-[7px] w-16 rounded bg-faint opacity-60" />
            </div>
            <span className="h-2.5 w-11 rounded bg-faint" />
          </div>
        ))}
      </div>
    </div>
  )
}
