import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from '@/shared/ErrorBoundary'
import { SessionProvider } from '@/shared/session'
import { useTelegram } from '@/shared/telegram'

export function AppProviders({ children }: { children: ReactNode }) {
  useTelegram()
  return (
    <ErrorBoundary>
      <SessionProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </SessionProvider>
    </ErrorBoundary>
  )
}
