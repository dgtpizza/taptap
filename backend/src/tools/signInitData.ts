import { createHmac } from 'node:crypto'

type DevUser = { id: number; first_name: string; username?: string; last_name?: string; language_code?: string }

function signInitData(user: DevUser, botToken: string, authDate = Math.floor(Date.now() / 1000)): string {
  const params = new URLSearchParams()
  params.set('user', JSON.stringify(user))
  params.set('auth_date', String(authDate))
  const dataCheckString = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = createHmac('sha256', secret).update(dataCheckString).digest('hex')
  params.set('hash', hash)
  return params.toString()
}

const botToken = process.env.BOT_TOKEN
if (!botToken) {
  console.error('BOT_TOKEN is required. Use the same token as backend/.env.')
  process.exit(1)
}

const user: DevUser = {
  id: Number(process.env.DEV_USER_ID ?? 777001),
  first_name: process.env.DEV_FIRST_NAME ?? 'Dev',
  username: process.env.DEV_USERNAME || undefined,
  last_name: process.env.DEV_LAST_NAME || undefined,
  language_code: process.env.DEV_LANG ?? 'en',
}

console.log(signInitData(user, botToken))
