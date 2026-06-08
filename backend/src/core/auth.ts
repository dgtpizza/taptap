import { createHmac, timingSafeEqual } from 'node:crypto'
import { AUTH_MAX_AGE_S } from '@shared/constants'
import { unauthorized } from '@/core/errors'

export type TgUser = {
  telegramId: number
  username?: string
  firstName: string
  lastName?: string
}

type TelegramInitDataUser = {
  id: unknown
  username?: unknown
  first_name: unknown
  last_name?: unknown
}

function parseTelegramUser(raw: string): TgUser {
  let u: TelegramInitDataUser
  try {
    u = JSON.parse(raw) as TelegramInitDataUser
  } catch {
    throw unauthorized('Bad user payload')
  }

  if (
    typeof u.id !== 'number' ||
    !Number.isSafeInteger(u.id) ||
    typeof u.first_name !== 'string' ||
    u.first_name.length === 0
  ) {
    throw unauthorized('Bad user payload')
  }
  if (u.username !== undefined && typeof u.username !== 'string') {
    throw unauthorized('Bad user payload')
  }
  if (u.last_name !== undefined && typeof u.last_name !== 'string') {
    throw unauthorized('Bad user payload')
  }

  const telegramId = u.id
  const firstName = u.first_name
  const username = u.username
  const lastName = u.last_name

  return {
    telegramId,
    username,
    firstName,
    lastName,
  }
}

export function validateInitData(initData: string, botToken: string, now = Date.now()): TgUser {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) throw unauthorized('No hash')
  params.delete('hash')

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n')

  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const calc = createHmac('sha256', secret).update(dataCheckString).digest('hex')
  const a = Buffer.from(calc, 'hex')
  const b = Buffer.from(hash, 'hex')
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw unauthorized('Bad signature')

  // Reject stale and future auth_date values to reduce replay risk and clock-skew abuse.
  const authDate = Number(params.get('auth_date') ?? 0)
  const ageS = now / 1000 - authDate
  if (!authDate || ageS > AUTH_MAX_AGE_S || ageS < -60) throw unauthorized('Expired')

  const raw = params.get('user')
  if (!raw) throw unauthorized('No user')
  return parseTelegramUser(raw)
}
