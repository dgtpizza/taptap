export function PodiumAvatar({
  size,
  ringClassName,
  ringWidth,
  gradient,
  initial,
  initialClassName,
  badge,
  badgeClassName,
}: {
  size: number
  ringClassName: string
  ringWidth: number
  gradient: string
  initial: string
  initialClassName: string
  badge: number
  badgeClassName: string
}) {
  // Tailwind ring utilities require static class names for JIT scanning.
  // Use box-shadow to render the ring so arbitrary widths (2.5px, 3px) work reliably.
  const ringColorVar = ringClassName.includes('gold')
    ? 'var(--color-rank-gold)'
    : ringClassName.includes('silver')
      ? 'var(--color-rank-silver)'
      : 'var(--color-rank-bronze)'

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="h-full w-full rounded-full"
        style={{
          background: gradient,
          boxShadow: `0 0 0 ${ringWidth}px ${ringColorVar}`,
        }}
      >
        <span
          className={`absolute inset-0 flex items-center justify-center font-bold ${initialClassName}`}
        >
          {initial}
        </span>
      </div>
      <span
        className={`absolute bottom-0 right-0 flex items-center justify-center rounded-pill ring-2 ring-surface ${badgeClassName}`}
      >
        <span className="font-extrabold text-on-accent leading-none">{badge}</span>
      </span>
    </div>
  )
}
