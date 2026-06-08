import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { AppError } from '@/core/errors'
import { validateInitData } from '@/core/auth'

const BOT_TOKEN = 'test-token:123'
const NOW = 1_700_000_000_000
const AUTH_DATE = Math.floor(NOW / 1000)

function sign(params: Record<string, string>): string {
  const data = new URLSearchParams(params)
  const dataCheckString = [...data.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest()
  const hash = createHmac('sha256', secret).update(dataCheckString).digest('hex')
  data.set('hash', hash)
  return data.toString()
}

function expectUnauthorized(fn: () => unknown): void {
  expect(fn).toThrow(AppError)
  try {
    fn()
  } catch (err) {
    expect(err).toMatchObject({ code: 'UNAUTHORIZED', status: 401 })
  }
}

describe('validateInitData', () => {
  it('returns trusted telegram user from signed initData', () => {
    const initData = sign({
      auth_date: String(AUTH_DATE),
      user: JSON.stringify({ id: 42, first_name: 'Ada', username: 'ada' }),
    })

    expect(validateInitData(initData, BOT_TOKEN, NOW)).toEqual({
      telegramId: 42,
      firstName: 'Ada',
      username: 'ada',
    })
  })

  it('rejects malformed signed user payload', () => {
    const initData = sign({ auth_date: String(AUTH_DATE), user: '{bad json' })
    expectUnauthorized(() => validateInitData(initData, BOT_TOKEN, NOW))
  })

  it('rejects signed user payload with invalid shape', () => {
    const initData = sign({
      auth_date: String(AUTH_DATE),
      user: JSON.stringify({ id: '42', first_name: 'Ada' }),
    })

    expectUnauthorized(() => validateInitData(initData, BOT_TOKEN, NOW))
  })
})
