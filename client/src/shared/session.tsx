import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type SessionState = {
  unauthorized: boolean
  expire: () => void
}

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [unauthorized, setUnauthorized] = useState(false)
  const expire = useCallback(() => setUnauthorized(true), [])
  const value = useMemo<SessionState>(() => ({ unauthorized, expire }), [unauthorized, expire])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
