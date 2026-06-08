import type { CSSProperties } from 'react'

export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <span className={`relative block overflow-hidden bg-sunken ${className}`} style={style} aria-hidden>
      <span
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        style={{ animation: 'shimmer 1.6s infinite' }}
      />
    </span>
  )
}
