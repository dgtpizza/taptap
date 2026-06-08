import { memo } from 'react'
import { useLeaderboardStore } from '@/features/leaderboard/LeaderboardProvider'
import { EmptyLeaderboard } from '@/features/leaderboard/ui/EmptyLeaderboard'
import { LeaderboardReady } from '@/features/leaderboard/ui/LeaderboardReady'
import { LeaderboardSkeleton } from '@/features/leaderboard/ui/LeaderboardSkeleton'
import { keys, t } from '@/shared/i18n'
import { RetryButton, StateMessage } from '@/shared/ui/StateMessage'
import { WifiOffIcon } from '@/shared/ui/icons'

export const LeaderboardScreen = memo(function LeaderboardScreen() {
  const { data, error, retry } = useLeaderboardStore()
  const empty = data !== null && data.top.length === 0

  return (
    <main className="relative min-h-0 flex-1">
      {data ? (
        empty ? (
          <EmptyLeaderboard />
        ) : (
          <LeaderboardReady data={data} />
        )
      ) : error ? (
        <StateMessage
          icon={<WifiOffIcon size={40} />}
          iconClassName="text-danger"
          title={t(keys.leaderboardUnavailable)}
          body={t(keys.checkConnection)}
          footer={<RetryButton label={t(keys.retry)} onClick={retry} />}
        />
      ) : (
        <LeaderboardSkeleton />
      )}
    </main>
  )
})
