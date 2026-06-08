import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { StarFourIcon } from '@/shared/ui/icons'

export interface StarSpecInput {
  x: number | string
  y: number | string
  size: number
  dx: number
  dy: number
  r0: number
  r1: number
  s1: number
  opacity?: number
  colorClass: string
  durationMs: number
  delayMs?: number
}

interface StarSpec extends StarSpecInput {
  id: number
}

export interface StarFieldHandle {
  emit(specs: StarSpecInput[]): void
}

interface StarFieldProps {
  keyframe: string
  timing: string
  loop?: boolean
  maxLive?: number
  className?: string
  style?: CSSProperties
  ariaHidden?: boolean
  seed?: () => StarSpecInput[]
}

export const StarField = forwardRef<StarFieldHandle, StarFieldProps>(function StarField(
  { keyframe, timing, loop = false, maxLive = Infinity, className, style, ariaHidden, seed },
  ref,
) {
  const counter = useRef(0)
  const [particles, setParticles] = useState<StarSpec[]>(() =>
    seed ? seed().map((s) => ({ ...s, id: counter.current++ })) : [],
  )

  useImperativeHandle(
    ref,
    () => ({
      emit(specs) {
        const added = specs.map((s) => ({ ...s, id: counter.current++ }))
        setParticles((prev) => {
          const next = [...prev, ...added]
          return next.length > maxLive ? next.slice(next.length - maxLive) : next
        })
      },
    }),
    [maxLive],
  )

  function remove(id: number) {
    setParticles((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <span className={className} style={style} aria-hidden={ariaHidden}>
      {particles.map((p) => (
        <span
          key={p.id}
          className={`absolute will-change-transform ${p.colorClass}`}
          style={{
            left: p.x,
            top: p.y,
            ['--dx' as string]: `${p.dx}px`,
            ['--dy' as string]: `${p.dy}px`,
            ['--r0' as string]: `${p.r0}deg`,
            ['--r1' as string]: `${p.r1}deg`,
            ['--s1' as string]: String(p.s1),
            ...(p.opacity != null ? { ['--o' as string]: p.opacity } : {}),
            animation: `${keyframe} ${p.durationMs}ms ${timing} ${p.delayMs ?? 0}ms ${loop ? 'infinite' : 'forwards'}`,
          }}
          onAnimationEnd={loop ? undefined : () => remove(p.id)}
        >
          <StarFourIcon size={p.size} />
        </span>
      ))}
    </span>
  )
})
