import { keys, t } from '@/shared/i18n'
import { Skeleton } from '@/shared/ui/Skeleton'
import { ZapIcon } from '@/shared/ui/icons'
import { CircularProgress } from '@/features/clicker/ui/CircularProgress'

export function ClickerSkeleton() {
  return (
    <div className="flex h-full w-full flex-col" data-testid="clicker-loading">
      <div className="flex w-full flex-col items-center gap-xl pt-sm">
        <div className="flex w-[calc(100vw-32px)] max-w-[340px] flex-col items-center gap-sm">
          <div className="flex h-14 w-full items-center gap-md rounded-pill bg-surface-strong px-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-pill bg-sunken">
              <span className="text-faint">
                <ZapIcon size={16} />
              </span>
            </div>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-pill bg-sunken">
              <div className="h-full w-[60px] rounded-pill bg-surface-strong" />
            </div>
            <Skeleton className="h-3.5 w-16 rounded-md bg-sunken" />
          </div>
          <Skeleton className="h-2.5 w-[120px] rounded bg-sunken" />
        </div>

        <div className="flex flex-col items-center gap-md">
          <Skeleton className="h-[87px] w-[231px] rounded-[18px] bg-surface-strong" />
          <Skeleton className="h-[13px] w-[98px] rounded-md bg-sunken" />
        </div>
      </div>

      <div className="flex w-full flex-1 items-center justify-center pb-[var(--tabbar-clearance)]">
        <div className="relative h-[300px] w-full">
          <div className="absolute left-1/2 top-[10px] h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-gold-glow blur-[40px]" />
          <div
            className="absolute left-1/2 top-[25px] h-[250px] w-[250px] -translate-x-1/2 rounded-full opacity-50"
            style={{ background: 'radial-gradient(100% 100% at 40% 35%, #FFE17A 20%, #F5C24A 65%, #C8881C 100%)' }}
          />
          <div className="absolute left-1/2 top-[150px] -translate-x-1/2 -translate-y-1/2">
            <div className="animate-spin [animation-duration:1.1s]">
              <CircularProgress size={240} value={0.25} strokeWidth={3} />
            </div>
          </div>
          <div className="absolute left-1/2 top-[150px] -translate-x-1/2 -translate-y-1/2">
            <span className="text-[13px] font-semibold uppercase tracking-[2px] text-gold-shadow opacity-80">
              {t(keys.loadingLabel)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
