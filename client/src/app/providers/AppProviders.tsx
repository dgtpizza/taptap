import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { StoreProvider } from '@/app/store/StoreProvider'
import { ErrorBoundary } from '@/shared/ErrorBoundary'
import { useTelegram } from '@/shared/telegram'

export function AppProviders({ children }: { children: ReactNode }) {
  useTelegram()
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <StoreProvider>{children}</StoreProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
