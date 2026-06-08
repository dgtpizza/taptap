import { describe, it, expect } from 'vitest'
import { keys, t } from '@/shared/i18n'

describe('i18n keys coverage', () => {
  it('keys map is identity-mapped', () => {
    for (const [name, value] of Object.entries(keys)) {
      expect(value).toBe(name)
    }
  })

  it('every key resolves to a non-empty string in the active language', () => {
    for (const key of Object.values(keys)) {
      const text = t(key)
      expect(typeof text).toBe('string')
      expect(text.length).toBeGreaterThan(0)
    }
  })

  it('exposes the full set of expected keys', () => {
    expect(Object.keys(keys)).toEqual(
      expect.arrayContaining([
        'needTelegram',
        'openFromTelegram',
        'somethingWentWrong',
        'reload',
        'loadingLabel',
        'retry',
        'profileUnavailable',
        'couldNotLoadProfile',
        'couldNotSyncClicks',
        'tap',
        'recharging',
        'leaderboardUnavailable',
        'couldNotLoadLeaderboard',
        'topN',
        'noPlayersYet',
        'you',
        'yourCurrentPosition',
        'tabPlay',
        'tabLeaders',
      ]),
    )
  })

  it('placeholder interpolation replaces only matching tokens', () => {
    expect(t(keys.topN, { n: 3, other: 'x' })).toBe('Top 3')
  })

  it('returns the raw template when no vars passed for a templated key', () => {
    expect(t(keys.topN)).toBe('Top {n}')
  })
})
