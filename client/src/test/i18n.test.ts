import { describe, it, expect } from 'vitest'
import { keys, t } from '@/shared/i18n'

describe('i18n', () => {
  it('exposes every key through the keys map', () => {
    expect(keys.tap).toBe('tap')
    expect(keys.topN).toBe('topN')
  })

  it('falls back to English when no Telegram language is set', () => {
    // jsdom has no window.Telegram, so detectLang() resolves to 'en'.
    expect(t(keys.you)).toBe('You')
  })

  it('interpolates named placeholders', () => {
    expect(t(keys.topN, { n: 25 })).toBe('Top 25')
  })
})
