import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onUnauthorized } from '@/shared/api'

export type SessionState = {
  unauthorized: boolean
}

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [unauthorized, setUnauthorized] = useState(false)
  useEffect(() => onUnauthorized(() => setUnauthorized(true)), [])
  const value = useMemo<SessionState>(() => ({ unauthorized }), [unauthorized])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
