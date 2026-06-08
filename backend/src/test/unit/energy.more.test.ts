import { describe, expect, it } from 'vitest'
import { ENERGY_MAX, REGEN_PER_SEC } from '@shared/constants'
import type { UserDoc } from '@/core/db'
import { currentEnergy, regenEnergy } from '@/modules/clicker/service'

const t = (s: number): Date => new Date(s * 1000)

describe('regenEnergy - extra cases', () => {
  it('keeps the value when no time has passed', () => {
    expect(regenEnergy(77, t(50), t(50))).toBe(77)
  })

  it('regenerates for elapsed whole seconds', () => {
    expect(regenEnergy(50, t(0), t(7))).toBe(50 + 7 * REGEN_PER_SEC)
  })

  it('floors fractional seconds', () => {
    expect(regenEnergy(0, new Date(0), new Date(2900))).toBe(2 * REGEN_PER_SEC)
  })

  it('clamps to ENERGY_MAX after a long absence', () => {
    expect(regenEnergy(ENERGY_MAX - 1, t(0), t(10_000))).toBe(ENERGY_MAX)
  })

  it('does not reduce energy when energyAt is in the future', () => {
    expect(regenEnergy(80, t(100), t(50))).toBe(80)
  })

  it('keeps max energy at max energy', () => {
    expect(regenEnergy(ENERGY_MAX, t(0), t(0))).toBe(ENERGY_MAX)
  })
})

describe('currentEnergy - document-based regeneration', () => {
  const makeDoc = (energy: number, energyAt: Date): UserDoc => ({
    _id: 1,
    firstName: 'E',
    clicks: 0,
    energy,
    energyAt,
    createdAt: energyAt,
    lastVisitedAt: energyAt,
  })

  it('regenerates from energyAt to now', () => {
    const doc = makeDoc(50, t(0))
    expect(currentEnergy(doc, t(5))).toBe(50 + 5 * REGEN_PER_SEC)
  })

  it('clamps to ENERGY_MAX', () => {
    const doc = makeDoc(ENERGY_MAX - 2, t(0))
    expect(currentEnergy(doc, t(1000))).toBe(ENERGY_MAX)
  })

  it('returns current energy when no time has passed', () => {
    const doc = makeDoc(75, t(10))
    expect(currentEnergy(doc, t(10))).toBe(75)
  })
})
