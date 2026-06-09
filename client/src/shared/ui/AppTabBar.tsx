import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { keys, t } from '@/shared/i18n'
import { hapticSelection } from '@/shared/telegram'
import { StarFourIcon, TrophyIcon } from '@/shared/ui/icons'

const tabs = [
  { to: '/', testId: 'tab-play', labelKey: keys.tabPlay, Icon: StarFourIcon },
  { to: '/leaderboard', testId: 'tab-leaders', labelKey: keys.tabLeaders, Icon: TrophyIcon },
] as const

export function AppTabBar() {
  const refs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [pill, setPill] = useState<{ left: number; width: number }>({ left: 0, width: 0 })
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[pathname]
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth })
    }
    measure()
    // Re-measure once the webfont metrics settle so the capsule matches final widths.
    document.fonts?.ready.then(measure).catch(() => {})
  }, [pathname])

  return (
    <nav
      className="fixed left-1/2 z-50 inline-flex -translate-x-1/2 items-stretch gap-1 rounded-pill border-[0.5px] border-border-subtle bg-surface-strong p-1 shadow-[0_12px_32px_0_#00000059]"
      style={{ bottom: 'max(calc(var(--shell-bottom) + 12px), 28px)' }}
      aria-label="Main"
    >
      <span
        className="absolute bottom-1 top-1 rounded-pill bg-accent transition-[left,width] duration-300 ease-out"
        style={{ left: pill.left, width: pill.width }}
        aria-hidden
      />
      {tabs.map(({ to, testId, labelKey, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          ref={(el) => {
            refs.current[to] = el
          }}
          onClick={() => {
            if (pathname !== to) hapticSelection()
          }}
          data-testid={testId}
          className={({ isActive }) =>
            `relative z-10 flex h-12 items-center justify-center gap-1.5 rounded-pill px-[18px] text-sm font-semibold no-underline transition-colors ${
              isActive ? 'text-on-accent' : 'text-muted'
            }`
          }
        >
          <Icon size={18} />
          <span>{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
