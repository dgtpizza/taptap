import { useClickerStore } from '@/features/clicker/ClickerProvider'
import { ClickerReady } from '@/features/clicker/ui/ClickerReady'
import { ClickerSkeleton } from '@/features/clicker/ui/ClickerSkeleton'
import { keys, t } from '@/shared/i18n'
import { RetryButton, StateMessage } from '@/shared/ui/StateMessage'
import { WifiOffIcon } from '@/shared/ui/icons'

export function ClickerScreen() {
  const state = useClickerStore()
  return (
    <main className="relative min-h-0 flex-1">
      {state.status === 'loading' ? (
        <ClickerSkeleton />
      ) : state.status === 'error' ? (
        <StateMessage
          icon={<WifiOffIcon size={40} />}
          iconClassName="text-danger"
          title={t(keys.profileUnavailable)}
          body={t(keys.couldNotLoadProfile)}
          footer={<RetryButton label={t(keys.retry)} onClick={state.retry} />}
        />
      ) : (
        <ClickerReady
          clicks={state.clicks}
          energy={state.energy}
          energyMax={state.energyMax}
          syncError={state.error}
          syncErrorVersion={state.errorVersion}
          onTap={state.tap}
        />
      )}
    </main>
  )
}
