import { createHmac } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { setTimeout as sleep } from 'node:timers/promises'

type LoadUser = { id: number; first_name: string; username: string }
type EmbeddedTarget = { baseUrl: string; cleanup: () => Promise<void> }
type Stats = {
  latencies: number[]
  statuses: Map<number, number>
  accepted: number
  networkErrors: number
}

function readInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`)
  return value
}

function readBool(name: string): boolean {
  return ['1', 'true', 'yes'].includes((process.env[name] ?? '').toLowerCase())
}

function signInitData(user: LoadUser, botToken: string, authDate = Math.floor(Date.now() / 1000)): string {
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

async function startEmbeddedTarget(botToken: string): Promise<EmbeddedTarget> {
  const { MongoDBContainer } = await import('@testcontainers/mongodb')
  const { buildApp } = await import('../app')

  const mongo = await new MongoDBContainer('mongo:7').start()
  process.env.MONGODB_URI = `${mongo.getConnectionString()}?directConnection=true`
  process.env.MONGODB_DB = `cryptoclicker_load_${process.pid}_${Date.now()}`
  process.env.BOT_TOKEN = botToken
  process.env.LOG_LEVEL ??= 'warn'

  const app = await buildApp()
  await app.listen({ host: '127.0.0.1', port: 0 })
  const address = app.server.address()
  if (!address || typeof address === 'string') throw new Error('could not read embedded backend address')

  return {
    baseUrl: `http://127.0.0.1:${address.port}/api`,
    cleanup: async () => {
      await app.close()
      await mongo.stop()
    },
  }
}

async function hitClicks(baseUrl: string, initData: string, count: number, nonce: string): Promise<{
  status: number
  accepted: number
}> {
  const response = await fetch(`${baseUrl}/clicks`, {
    method: 'POST',
    headers: {
      authorization: `tma ${initData}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ count, nonce }),
  })
  const body = (await response.json().catch(() => null)) as { accepted?: unknown } | null
  return {
    status: response.status,
    accepted: response.ok && typeof body?.accepted === 'number' ? body.accepted : 0,
  }
}

async function runUser(
  baseUrl: string,
  user: LoadUser,
  botToken: string,
  batch: number,
  intervalMs: number,
  endAt: number,
  stats: Stats,
): Promise<void> {
  const initData = signInitData(user, botToken)
  let seq = 0

  while (performance.now() < endAt) {
    const started = performance.now()
    try {
      const result = await hitClicks(baseUrl, initData, batch, `load-${user.id}-${seq++}`)
      const elapsed = performance.now() - started
      stats.latencies.push(elapsed)
      stats.statuses.set(result.status, (stats.statuses.get(result.status) ?? 0) + 1)
      stats.accepted += result.accepted
    } catch {
      stats.networkErrors += 1
    }

    const waitMs = intervalMs - (performance.now() - started)
    if (waitMs > 0) await sleep(waitMs)
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[index] ?? 0
}

function fmtMs(value: number): string {
  return `${value.toFixed(1)} ms`
}

async function main(): Promise<void> {
  const autostart = readBool('LOAD_AUTOSTART')
  const botToken = process.env.BOT_TOKEN || (autostart ? 'load-test-token:local' : '')
  if (!botToken) throw new Error('BOT_TOKEN is required unless LOAD_AUTOSTART=1 is used')

  const users = readInt('LOAD_USERS', 25)
  const seconds = readInt('LOAD_SECONDS', 10)
  const intervalMs = readInt('LOAD_INTERVAL_MS', 300)
  const batch = readInt('LOAD_BATCH', 1)
  const embedded = autostart ? await startEmbeddedTarget(botToken) : null
  const baseUrl = (embedded?.baseUrl ?? process.env.LOAD_BASE_URL ?? 'http://127.0.0.1:3000/api').replace(/\/+$/, '')
  const stats: Stats = { latencies: [], statuses: new Map(), accepted: 0, networkErrors: 0 }
  const started = performance.now()
  const endAt = started + seconds * 1000
  let finished = started

  try {
    await Promise.all(
      Array.from({ length: users }, (_, index) =>
        runUser(
          baseUrl,
          { id: 900_000 + index, first_name: `Load${index}`, username: `load${index}` },
          botToken,
          batch,
          intervalMs,
          endAt,
          stats,
        ),
      ),
    )
    finished = performance.now()
  } finally {
    await embedded?.cleanup()
  }

  const elapsedSec = (finished - started) / 1000
  const sorted = [...stats.latencies].sort((a, b) => a - b)
  const requests = stats.latencies.length
  const ok = stats.statuses.get(200) ?? 0
  const statuses = [...stats.statuses.entries()]
    .sort(([a], [b]) => a - b)
    .map(([status, count]) => `${status}:${count}`)
    .join(', ')

  console.log('Load test: POST /api/clicks')
  console.log(`target=${baseUrl}`)
  console.log(`users=${users} duration=${seconds}s interval=${intervalMs}ms batch=${batch}`)
  console.log(`requests=${requests} ok=${ok} networkErrors=${stats.networkErrors} rps=${(requests / elapsedSec).toFixed(1)}`)
  console.log(`acceptedClicks=${stats.accepted} statuses=${statuses || 'none'}`)
  console.log(
    `latency p50=${fmtMs(percentile(sorted, 50))} p95=${fmtMs(percentile(sorted, 95))} p99=${fmtMs(
      percentile(sorted, 99),
    )} max=${fmtMs(sorted.at(-1) ?? 0)}`,
  )
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
