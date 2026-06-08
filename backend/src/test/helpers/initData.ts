import { createHmac } from 'node:crypto'

export type SignUser = { id: number; first_name: string; username?: string; last_name?: string }

// Builds signed Telegram initData for auth tests.
export function signInitData(
  user: SignUser,
  botToken: string,
  authDate = Math.floor(Date.now() / 1000),
): string {
  const params = new URLSearchParams()
  params.set('user', JSON.stringify(user))
  params.set('auth_date', String(authDate))
  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = createHmac('sha256', secret).update(dataCheckString).digest('hex')
  params.set('hash', hash)
  return params.toString()
}
