import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { POLL_MS } from '@shared/constants'
import type { LeaderboardResponse } from '@shared/contract'
import { api, isUnauthorized } from '@/shared/api'
import { errorMessage, isAbortError, reportError } from '@/shared/errors'
import { keys, t } from '@/shared/i18n'

export type LeaderboardState = {
  data: LeaderboardResponse | null
  error: string | null
  unauthorized: boolean
  retry: () => void
}

const LeaderboardContext = createContext<LeaderboardState | null>(null)

// Mounted above the routes so the board survives navigation; polls only while the route is open.
export function LeaderboardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)
  const [reload, setReload] = useState(0)
  const active = useLocation().pathname === '/leaderboard'

  useEffect(() => {
    if (!active) return
    let alive = true
    let controller: AbortController | null = null

    const load = () => {
      if (document.hidden) return
      controller?.abort()
      controller = new AbortController()
      api
        .leaderboard(controller.signal)
        .then((d) => {
          if (!alive) return
          setData(d)
          setError(null)
          setUnauthorized(false)
        })
        .catch((err: unknown) => {
          if (isAbortError(err) || !alive) return
          reportError(err, { area: 'leaderboard', action: 'load' })
          setUnauthorized(isUnauthorized(err))
          setError(errorMessage(err, t(keys.couldNotLoadLeaderboard)))
        })
    }

    load()
    const id = setInterval(load, POLL_MS)
    const loadWhenVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', loadWhenVisible)
    return () => {
      alive = false
      controller?.abort()
      clearInterval(id)
      document.removeEventListener('visibilitychange', loadWhenVisible)
    }
  }, [active, reload])

  const retry = useCallback(() => {
    setError(null)
    setUnauthorized(false)
    setReload((n) => n + 1)
  }, [])

  const value = useMemo<LeaderboardState>(
    () => ({ data, error, unauthorized, retry }),
    [data, error, unauthorized, retry],
  )

  return <LeaderboardContext.Provider value={value}>{children}</LeaderboardContext.Provider>
}

export function useLeaderboardStore(): LeaderboardState {
  const ctx = useContext(LeaderboardContext)
  if (!ctx) throw new Error('useLeaderboardStore must be used inside LeaderboardProvider')
  return ctx
}
