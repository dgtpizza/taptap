import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { StoreProvider } from '@/app/store/StoreProvider'
import { ClickerScreen } from '@/features/clicker/ClickerScreen'
import { LeaderboardScreen } from '@/features/leaderboard/LeaderboardScreen'
import { NoTelegram, NotFound, SessionExpired } from '@/features/system/SystemScreens'
import { useSession } from '@/shared/session'
import { hasInitData } from '@/shared/telegram'
import { AppShell } from '@/shared/ui/AppShell'

function RequireAuth() {
  const { unauthorized } = useSession()
  if (!hasInitData()) return <Navigate to="/welcome" replace />
  if (unauthorized) return <Navigate to="/session-expired" replace />
  return <Outlet />
}

export function App() {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route
          element={
            <StoreProvider>
              <Outlet />
            </StoreProvider>
          }
        >
          <Route element={<AppShell />}>
            <Route path="/" element={<ClickerScreen />} />
            <Route path="/leaderboard" element={<LeaderboardScreen />} />
          </Route>
        </Route>
      </Route>
      <Route path="/welcome" element={<NoTelegram />} />
      <Route path="/session-expired" element={<SessionExpired />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
