import { rnd } from '@/shared/ui/stars/rnd'
import type { StarSpecInput } from '@/shared/ui/stars/StarField'

const TAP = {
  minPerTap: 2,
  maxPerTap: 4,
  minSize: 18,
  maxSize: 38,
  minDistance: 150,
  maxDistance: 260,
  durationMs: 1700,
  spinMinDeg: -120,
  spinMaxDeg: 120,
  s1: 0.4,
  colorClass: 'text-gold-light',
}

export const maxLiveParticles = 90

export function buildTapBurst(cx: number, cy: number): StarSpecInput[] {
  const count = Math.round(rnd(TAP.minPerTap, TAP.maxPerTap))
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2
    const dist = rnd(TAP.minDistance, TAP.maxDistance)
    const r0 = rnd(TAP.spinMinDeg, TAP.spinMaxDeg)
    return {
      x: cx,
      y: cy,
      size: rnd(TAP.minSize, TAP.maxSize),
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      r0,
      r1: r0 + rnd(TAP.spinMinDeg, TAP.spinMaxDeg),
      s1: TAP.s1,
      colorClass: TAP.colorClass,
      durationMs: TAP.durationMs,
    }
  })
}
