import { describe, expect, it } from 'vitest'
import { ENERGY_MAX, REGEN_PER_SEC } from '@shared/constants'
import { regenEnergy } from '@/modules/clicker/service'

const t = (s: number): Date => new Date(s * 1000)

describe('regenEnergy', () => {
  it('caps at ENERGY_MAX', () => {
    expect(regenEnergy(ENERGY_MAX, t(0), t(100))).toBe(ENERGY_MAX)
  })
  it('regenerates REGEN_PER_SEC per second', () => {
    expect(regenEnergy(0, t(0), t(10))).toBe(10 * REGEN_PER_SEC)
  })
  it('stays put on zero elapsed', () => {
    expect(regenEnergy(42, t(5), t(5))).toBe(42)
  })
  it('does not go below current on negative elapsed (clock skew)', () => {
    expect(regenEnergy(42, t(10), t(5))).toBe(42)
  })
})
