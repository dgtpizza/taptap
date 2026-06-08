import { useState } from 'react'

export function userpicUrl(username: string): string {
  return `https://t.me/i/userpic/320/${username}.svg`
}

// Overlays Telegram's public userpic on top of the placeholder it shares a slot with.
// Renders nothing when there is no username or the image fails to load, so the
// gradient/initial underneath stays visible.
export function Userpic({ username, className }: { username?: string; className?: string }) {
  const [failed, setFailed] = useState(false)

  if (!username || failed) return null

  return (
    <img
      src={userpicUrl(username)}
      alt=""
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
