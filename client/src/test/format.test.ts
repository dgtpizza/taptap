import { describe, it, expect } from 'vitest'
import { formatCount } from '@/shared/format'

describe('formatCount', () => {
  it('formats numbers with en-US commas', () => {
    expect(formatCount(1000)).toBe('1,000')
    expect(formatCount(1234567)).toBe('1,234,567')
  })

  it('returns "0" for zero', () => {
    expect(formatCount(0)).toBe('0')
  })

  it('floors fractional values', () => {
    expect(formatCount(9.9)).toBe('9')
    expect(formatCount(999.99)).toBe('999')
  })

  it('clamps negative values to 0', () => {
    expect(formatCount(-5)).toBe('0')
  })

  it('small integers are unchanged', () => {
    expect(formatCount(42)).toBe('42')
  })
})
