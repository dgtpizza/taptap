import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { AUTH_MAX_AGE_S } from '@shared/constants'
import { AppError } from '@/core/errors'
import { validateInitData } from '@/core/auth'

const BOT_TOKEN = 'test-token:123'
const NOW = 1_700_000_000_000
const AUTH_DATE = Math.floor(NOW / 1000)

function sign(params: Record<string, string>, token = BOT_TOKEN): string {
  const data = new URLSearchParams(params)
  const dataCheckString = [...data.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(token).digest()
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

const user = (extra: Record<string, unknown> = {}): string =>
  JSON.stringify({ id: 42, first_name: 'Ada', ...extra })

describe('validateInitData - signature and format', () => {
  it('rejects missing hash with 401', () => {
    const initData = `auth_date=${AUTH_DATE}&user=${encodeURIComponent(user())}`
    expectUnauthorized(() => validateInitData(initData, BOT_TOKEN, NOW))
  })

  it('rejects a signature made with another token with 401', () => {
    const initData = sign({ auth_date: String(AUTH_DATE), user: user() }, 'another-token:999')
    expectUnauthorized(() => validateInitData(initData, BOT_TOKEN, NOW))
  })

  it('rejects a field changed after signing with 401', () => {
    const signed = sign({ auth_date: String(AUTH_DATE), user: user() })
    const params = new URLSearchParams(signed)
    params.set('user', user({ first_name: 'Mallory' }))
    expectUnauthorized(() => validateInitData(params.toString(), BOT_TOKEN, NOW))
  })

  it('rejects a hash with a different length with 401', () => {
    const signed = sign({ auth_date: String(AUTH_DATE), user: user() })
    const params = new URLSearchParams(signed)
    params.set('hash', 'abcd')
    expectUnauthorized(() => validateInitData(params.toString(), BOT_TOKEN, NOW))
  })
})

describe('validateInitData - auth_date / TTL', () => {
  it('rejects missing auth_date with 401', () => {
    const initData = sign({ user: user() })
    expectUnauthorized(() => validateInitData(initData, BOT_TOKEN, NOW))
  })

  it('rejects stale auth_date with 401', () => {
    const stale = AUTH_DATE - AUTH_MAX_AGE_S - 1
    const initData = sign({ auth_date: String(stale), user: user() })
    expectUnauthorized(() => validateInitData(initData, BOT_TOKEN, NOW))
  })

  it('accepts auth_date exactly on the TTL boundary', () => {
    const edge = AUTH_DATE - AUTH_MAX_AGE_S
    const initData = sign({ auth_date: String(edge), user: user() })
    expect(validateInitData(initData, BOT_TOKEN, NOW)).toMatchObject({ telegramId: 42 })
  })

  it('rejects auth_date more than 60 seconds in the future with 401', () => {
    const future = AUTH_DATE + 61
    const initData = sign({ auth_date: String(future), user: user() })
    expectUnauthorized(() => validateInitData(initData, BOT_TOKEN, NOW))
  })

  it('allows a small future clock skew', () => {
    const future = AUTH_DATE + 30
    const initData = sign({ auth_date: String(future), user: user() })
    expect(validateInitData(initData, BOT_TOKEN, NOW)).toMatchObject({ telegramId: 42 })
  })

  it('accepts a fresh auth_date', () => {
    const initData = sign({ auth_date: String(AUTH_DATE), user: user() })
    expect(validateInitData(initData, BOT_TOKEN, NOW)).toMatchObject({ telegramId: 42, firstName: 'Ada' })
  })
})

describe('validateInitData - user parsing', () => {
  it('parses last_name and username', () => {
    const initData = sign({
      auth_date: String(AUTH_DATE),
      user: user({ username: 'ada', last_name: 'Lovelace' }),
    })
    expect(validateInitData(initData, BOT_TOKEN, NOW)).toEqual({
      telegramId: 42,
      firstName: 'Ada',
      username: 'ada',
      lastName: 'Lovelace',
    })
  })

  it('leaves username and lastName undefined when missing', () => {
    const initData = sign({ auth_date: String(AUTH_DATE), user: user() })
    const result = validateInitData(initData, BOT_TOKEN, NOW)
    expect(result.username).toBeUndefined()
    expect(result.lastName).toBeUndefined()
  })

  it('rejects missing user with 401', () => {
    const initData = sign({ auth_date: String(AUTH_DATE) })
    expectUnauthorized(() => validateInitData(initData, BOT_TOKEN, NOW))
  })

  it('rejects a string id with 401', () => {
    const initData = sign({ auth_date: String(AUTH_DATE), user: JSON.stringify({ id: '42', first_name: 'Ada' }) })
    expectUnauthorized(() => validateInitData(initData, BOT_TOKEN, NOW))
  })

  it('rejects an unsafe integer id with 401', () => {
    const initData = sign({
      auth_date: String(AUTH_DATE),
      user: JSON.stringify({ id: Number.MAX_SAFE_INTEGER + 2, first_name: 'Ada' }),
    })
    expectUnauthorized(() => validateInitData(initData, BOT_TOKEN, NOW))
  })

  it('rejects an empty first_name with 401', () => {
    const initData = sign({ auth_date: String(AUTH_DATE), user: JSON.stringify({ id: 42, first_name: '' }) })
    expectUnauthorized(() => validateInitData(initData, BOT_TOKEN, NOW))
  })

  it('rejects a non-string username with 401', () => {
    const initData = sign({
      auth_date: String(AUTH_DATE),
      user: JSON.stringify({ id: 42, first_name: 'Ada', username: 123 }),
    })
    expectUnauthorized(() => validateInitData(initData, BOT_TOKEN, NOW))
  })

  it('rejects a non-string last_name with 401', () => {
    const initData = sign({
      auth_date: String(AUTH_DATE),
      user: JSON.stringify({ id: 42, first_name: 'Ada', last_name: true }),
    })
    expectUnauthorized(() => validateInitData(initData, BOT_TOKEN, NOW))
  })

  it('rejects malformed user JSON with 401', () => {
    const initData = sign({ auth_date: String(AUTH_DATE), user: '{not json' })
    expectUnauthorized(() => validateInitData(initData, BOT_TOKEN, NOW))
  })
})
