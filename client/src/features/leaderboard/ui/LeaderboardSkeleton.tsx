import { Skeleton } from '@/shared/ui/Skeleton'

type PodiumCol = { avatar: string; pedestal: string; crown: boolean }

const PODIUM_COLS: PodiumCol[] = [
  { avatar: 'h-16 w-16', pedestal: 'h-[80px] w-[104px]', crown: false },
  { avatar: 'h-[88px] w-[88px]', pedestal: 'h-[130px] w-[112px]', crown: true },
  { avatar: 'h-16 w-16', pedestal: 'h-[45px] w-[104px]', crown: false },
]

const LIST_ROWS = [0, 1, 2, 3, 4, 5, 6, 7]

function TextLine({ width }: { width: string }) {
  return (
    <div className="flex h-[18px] items-center">
      <Skeleton className={`h-2.5 ${width} rounded`} />
    </div>
  )
}

export function LeaderboardSkeleton() {
  return (
    <div className="flex h-full flex-col" data-testid="leaderboard-loading">
      <div className="px-lg">
        <div className="flex items-end justify-center gap-[14px] overflow-hidden rounded-card bg-surface px-lg pt-2xl">
          {PODIUM_COLS.map((col, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              {col.crown ? <Skeleton className="h-[22px] w-[22px] rounded-full" /> : null}
              <Skeleton className={`${col.avatar} rounded-full`} />
              <TextLine width="w-14" />
              <TextLine width="w-10" />
              <Skeleton className={`${col.pedestal} rounded-t-[12px]`} />
            </div>
          ))}
        </div>
      </div>

      <div className="px-lg pt-md">
        <Skeleton className="h-16 w-full rounded-card" />
      </div>

      <div className="flex items-center justify-between px-lg pb-sm pt-[14px]">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-[var(--tabbar-clearance)]">
        <div className="px-lg pb-md">
          <div className="overflow-hidden rounded-card bg-surface">
            {LIST_ROWS.map((i) => (
              <div key={i} className="flex h-14 items-center gap-md px-lg">
                <Skeleton className="h-4 w-6 rounded" />
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-3.5 flex-1 rounded" />
                <Skeleton className="h-3.5 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
