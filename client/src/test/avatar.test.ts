import { describe, it, expect } from 'vitest'
import { avatarColor, initialOf } from '@/shared/ui/avatar'

describe('initialOf', () => {
  it('returns the first character uppercased', () => {
    expect(initialOf('alice')).toBe('A')
    expect(initialOf('Bob')).toBe('B')
  })

  it('trims leading spaces before picking the initial', () => {
    expect(initialOf('  zoe')).toBe('Z')
  })

  it('returns "?" for an empty string', () => {
    expect(initialOf('')).toBe('?')
  })

  it('handles multibyte characters', () => {
    expect(initialOf('émile')).toBe('É')
  })
})

describe('avatarColor', () => {
  it('returns an hsl(...) string', () => {
    const color = avatarColor('42')
    expect(color).toMatch(/^hsl\(\d+ \d+% \d+%\)$/)
  })

  it('is deterministic: same seed yields same color', () => {
    expect(avatarColor('123')).toBe(avatarColor('123'))
    expect(avatarColor('abc')).toBe(avatarColor('abc'))
  })

  it('different seeds yield different colors', () => {
    expect(avatarColor('1')).not.toBe(avatarColor('2'))
  })
})
