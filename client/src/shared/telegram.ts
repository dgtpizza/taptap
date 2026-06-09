import { useEffect } from 'react'

type TgUser = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}
type WebApp = {
  initData: string
  initDataUnsafe: { user?: TgUser }
  ready: () => void
  expand: () => void
  requestFullscreen?: () => void
  disableVerticalSwipes?: () => void
  HapticFeedback?: { impactOccurred: (style: 'light' | 'medium' | 'heavy') => void }
}

declare global {
  interface Window {
    Telegram?: { WebApp: WebApp }
  }
}

export function getWebApp(): WebApp | undefined {
  return window.Telegram?.WebApp
}

export function getInitData(): string {
  return getWebApp()?.initData || (import.meta.env.DEV ? (import.meta.env.VITE_DEV_INIT_DATA ?? '') : '')
}

export function hasInitData(): boolean {
  return getInitData().length > 0
}

export function hapticTap(): void {
  try {
    getWebApp()?.HapticFeedback?.impactOccurred('light')
  } catch {
    // Telegram SDK integrations should never block a tap.
  }
}

export function useTelegram(): void {
  useEffect(() => {
    const wa = getWebApp()
    try {
      wa?.ready()
      wa?.expand()
      wa?.requestFullscreen?.()
      wa?.disableVerticalSwipes?.()
    } catch {
      // The host WebView owns these optional integrations; app rendering must keep going.
    }
  }, [])
}
