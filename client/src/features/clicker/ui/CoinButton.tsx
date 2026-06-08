import { useRef } from 'react'
import { buildTapBurst, maxLiveParticles } from '@/features/clicker/particles/particleConfig'
import { Coin } from '@/features/clicker/ui/Coin'
import { keys, t } from '@/shared/i18n'
import { prefersReducedMotion } from '@/shared/motion'
import { hapticTap } from '@/shared/telegram'
import { StarFourIcon } from '@/shared/ui/icons'
import { StarField, type StarFieldHandle } from '@/shared/ui/stars/StarField'

export function CoinButton({ disabled, onTap }: { disabled: boolean; onTap: (trusted: boolean) => void }) {
  const fieldRef = useRef<StarFieldHandle>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  function emitTap(trusted: boolean) {
    onTap(trusted)
    if (!trusted) return
    hapticTap()
    if (prefersReducedMotion()) return
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    fieldRef.current?.emit(buildTapBurst(rect.width / 2, rect.height / 2))
  }

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    // Out of energy: no tap, no star burst, but a real touch still gets haptic feedback.
    if (disabled) {
      if (e.nativeEvent.isTrusted) hapticTap()
      return
    }
    emitTap(e.nativeEvent.isTrusted)
  }

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (e.detail !== 0 || disabled) return
    emitTap(e.nativeEvent.isTrusted)
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`relative isolate block w-full border-0 bg-transparent p-0 transition-transform duration-75 ${
        disabled ? 'cursor-default opacity-60' : 'cursor-pointer active:scale-[0.97]'
      }`}
      aria-label={disabled ? t(keys.recharging) : t(keys.tap)}
      aria-disabled={disabled}
      data-testid="tap-button"
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <Coin className="z-10">
        <span className="text-gold-shadow">
          <StarFourIcon size={90} />
        </span>
      </Coin>

      <StarField
        ref={fieldRef}
        keyframe="particle-fly"
        timing="ease-out"
        maxLive={maxLiveParticles}
        className="pointer-events-none absolute inset-0 z-0 overflow-visible"
      />
    </button>
  )
}
