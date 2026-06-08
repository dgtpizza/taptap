import { useEffect, useState } from 'react'

export function Toast({
  message,
  version = 0,
  durationMs = 3000,
}: {
  message: string | null
  version?: number
  durationMs?: number
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!message) {
      setVisible(false)
      return
    }

    setVisible(true)
    const id = window.setTimeout(() => setVisible(false), durationMs)
    return () => window.clearTimeout(id)
  }, [durationMs, message, version])

  if (!message || !visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="sync-toast"
      className="fixed left-1/2 z-50 w-[calc(100vw-32px)] max-w-[448px] -translate-x-1/2 rounded-button border border-border-subtle bg-surface-strong px-lg py-md text-center text-sm font-medium text-ink shadow-[0_12px_32px_0_#00000059]"
      style={{ top: 'calc(var(--shell-top) + 8px)' }}
    >
      {message}
    </div>
  )
}
