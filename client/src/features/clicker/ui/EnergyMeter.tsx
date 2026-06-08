import { formatCount } from '@/shared/format'
import { keys, t } from '@/shared/i18n'
import { LightningIcon } from '@/shared/ui/icons'

const LOW_ENERGY = 15

type Tone = 'full' | 'spending' | 'low'

function energyTone(value: number, max: number): Tone {
  if (value <= LOW_ENERGY) return 'low'
  if (value >= max) return 'full'
  return 'spending'
}

const TONE: Record<Tone, { text: string; bg: string; fill: string }> = {
  full: { text: 'text-accent', bg: 'bg-accent/15', fill: 'bg-accent' },
  spending: { text: 'text-warning', bg: 'bg-warning/15', fill: 'bg-warning' },
  low: { text: 'text-danger', bg: 'bg-danger/15', fill: 'bg-danger' },
}

export function EnergyMeter({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const tone = TONE[energyTone(value, max)]

  return (
    <div className="relative flex w-[calc(100vw-32px)] max-w-[340px] flex-col items-center">
      <div className="flex h-14 w-full items-center gap-md rounded-pill bg-surface-strong pr-lg pl-2.5">
        <div
          className={`relative isolate flex h-9 w-9 items-center justify-center rounded-pill transition-colors duration-500 ${tone.bg} ${tone.text}`}
        >
          <span className="absolute inset-0 z-0 rounded-pill border border-current animate-[onair_3.6s_ease-out_infinite]" />
          <span className="absolute inset-0 z-0 rounded-pill border border-current animate-[onair_3.6s_ease-out_infinite] [animation-delay:1.2s]" />
          <span className="absolute inset-0 z-0 rounded-pill border border-current animate-[onair_3.6s_ease-out_infinite] [animation-delay:2.4s]" />
          <span className="relative z-10">
            <LightningIcon size={18} />
          </span>
        </div>

        <div
          className="relative h-1.5 flex-1 overflow-hidden rounded-pill bg-sunken"
          data-testid="energy-meter"
          role="meter"
          aria-label={t(keys.energy)}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
        >
          <div
            className={`h-full rounded-pill transition-colors duration-500 ${tone.fill}`}
            data-testid="energy-fill"
            style={{ width: `${pct}%` }}
          />
        </div>

        <span className="text-[15px] font-semibold text-ink tabular-nums" data-testid="energy-value">
          {`${formatCount(value)} / ${formatCount(max)}`}
        </span>
      </div>

      {value < max && (
        <div
          className="absolute left-1/2 top-full mt-1.5 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap"
          data-testid="energy-recharging"
        >
          <span className={`h-1.5 w-1.5 rounded-pill transition-colors duration-500 ${tone.fill}`} />
          <span className="text-xs font-medium text-muted">{t(keys.recharging)}</span>
        </div>
      )}
    </div>
  )
}
