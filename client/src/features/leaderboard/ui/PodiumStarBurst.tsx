import { BURST_COLORS, PODIUM_BURST } from '@/features/leaderboard/ui/podiumBurstConfig'
import { prefersReducedMotion } from '@/shared/motion'
import { rnd } from '@/shared/ui/stars/rnd'
import { StarField, type StarSpecInput } from '@/shared/ui/stars/StarField'

function buildStars(): StarSpecInput[] {
  const { count, spreadX, spreadY, minSize, maxSize, minOpacity, maxOpacity, minDurationMs, maxDurationMs } =
    PODIUM_BURST
  return Array.from({ length: count }, (_, i) => {
    const angle = rnd(0, Math.PI * 2)
    const reach = Math.sqrt(Math.random())
    const durationMs = rnd(minDurationMs, maxDurationMs)
    return {
      x: 0,
      y: 0,
      size: rnd(minSize, maxSize),
      dx: Math.cos(angle) * spreadX * reach,
      dy: Math.sin(angle) * spreadY * reach,
      r0: rnd(-60, 60),
      r1: rnd(-200, 200),
      s1: 0.5,
      opacity: rnd(minOpacity, maxOpacity),
      colorClass: BURST_COLORS[i % BURST_COLORS.length] ?? 'text-gold',
      durationMs,
      delayMs: -rnd(0, durationMs),
    }
  })
}

export function PodiumStarBurst() {
  return (
    <StarField
      seed={() => (prefersReducedMotion() ? [] : buildStars())}
      loop
      keyframe="star-emit"
      timing="linear"
      ariaHidden
      className="pointer-events-none absolute left-1/2 z-0"
      style={{ top: PODIUM_BURST.originTop }}
    />
  )
}
