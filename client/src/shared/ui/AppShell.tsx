import { memo } from 'react'
import { Outlet } from 'react-router-dom'
import { AppTabBar } from '@/shared/ui/AppTabBar'

// Memoized so a clicker tick re-renders only the route, not the shell and tab bar.
export const AppShell = memo(function AppShell() {
  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-[480px] flex-col overflow-hidden text-ink">
      <div className="shrink-0" style={{ height: 'var(--shell-top)' }} aria-hidden />
      <Outlet />
      <AppTabBar />
    </div>
  )
})
