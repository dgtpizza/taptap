import { createContext, useContext, type ReactNode } from 'react'
import { useClicker, type ClickerState } from '@/features/clicker/useClicker'

const ClickerStoreContext = createContext<ClickerState | null>(null)

export function ClickerProvider({ children }: { children: ReactNode }) {
  const clicker = useClicker()
  return <ClickerStoreContext.Provider value={clicker}>{children}</ClickerStoreContext.Provider>
}

export function useClickerStore(): ClickerState {
  const ctx = useContext(ClickerStoreContext)
  if (!ctx) throw new Error('useClickerStore must be used inside ClickerProvider')
  return ctx
}

export { ClickerStoreContext }
