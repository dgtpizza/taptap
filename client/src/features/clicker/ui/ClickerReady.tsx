import { CoinButton } from '@/features/clicker/ui/CoinButton'
import { EnergyMeter } from '@/features/clicker/ui/EnergyMeter'
import { ScoreHero } from '@/features/clicker/ui/ScoreHero'
import { Toast } from '@/shared/ui/Toast'

export function ClickerReady({
  clicks,
  energy,
  energyMax,
  syncError,
  syncErrorVersion,
  onTap,
}: {
  clicks: number
  energy: number
  energyMax: number
  syncError: string | null
  syncErrorVersion: number
  onTap: (trusted: boolean) => void
}) {
  return (
    <div className="flex h-full w-full flex-col">
      <Toast message={syncError} version={syncErrorVersion} />
      <div className="flex w-full flex-col items-center gap-2xl pt-sm">
        <EnergyMeter value={energy} max={energyMax} />
        <ScoreHero value={clicks} />
      </div>
      <div className="flex w-full flex-1 flex-col items-center justify-center pb-[var(--tabbar-clearance)]">
        <CoinButton disabled={energy < 1} onTap={onTap} />
      </div>
    </div>
  )
}
