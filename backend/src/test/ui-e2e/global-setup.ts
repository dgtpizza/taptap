import { spawn, type ChildProcess } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { MongoDBContainer, type StartedMongoDBContainer } from '@testcontainers/mongodb'
import { connectDb, type DbHandle } from '../../core/db'
import { createHarnessState, freePort, waitHealth } from '../helpers/serverHarness'
import { TEST_BOT_TOKEN, seedUsers } from '../api-e2e/config'
import { UI_E2E_STATE_ENV } from './config'

const here = dirname(fileURLToPath(import.meta.url))
const backendRoot = join(here, '..', '..', '..')
const repoRoot = join(backendRoot, '..')
const clientRoot = join(repoRoot, 'client')

let container: StartedMongoDBContainer | undefined
let backend: ChildProcess | undefined
let client: ChildProcess | undefined

async function cleanup(): Promise<void> {
  client?.kill()
  backend?.kill()
  await container?.stop()
}

async function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: 'inherit' })
    child.once('exit', (code, signal) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} failed: code=${code}, signal=${signal}`))
    })
    child.once('error', reject)
  })
}

async function waitUrl(url: string, child: ChildProcess, timeoutMs = 25_000): Promise<void> {
  let exit: { code: number | null; signal: NodeJS.Signals | null } | undefined
  child.once('exit', (code, signal) => {
    exit = { code, signal }
  })

  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (exit) throw new Error(`process exited before readiness check: code=${exit.code}, signal=${exit.signal}`)
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Keep polling while the child process is starting.
    }
    await new Promise((res) => setTimeout(res, 300))
  }
  throw new Error(`${url} did not become ready`)
}

// Boots real Mongo, API backend and production client preview so the browser drives the split app.
export default async function globalSetup(): Promise<() => Promise<void>> {
  let db: DbHandle | undefined
  try {
    container = await new MongoDBContainer('mongo:7').start()
    const uri = `${container.getConnectionString()}?directConnection=true`
    const backendState = createHarnessState('cryptoclicker-ui-e2e-api', await freePort())
    const clientPort = await freePort()
    const clientUrl = `http://127.0.0.1:${clientPort}`

    db = await connectDb(uri, backendState.dbName)
    const now = new Date()
    await db.User.insertMany(
      seedUsers.map((s) => ({
        _id: s.id,
        firstName: s.first_name,
        ...(s.username ? { username: s.username } : {}),
        clicks: s.clicks,
        energy: 1000,
        energyAt: now,
        createdAt: now,
        lastVisitedAt: now,
      })),
    )
    await db.connection.close()
    db = undefined

    backend = spawn(join(backendRoot, 'node_modules', '.bin', 'tsx'), ['src/server.ts'], {
      cwd: backendRoot,
      env: {
        ...process.env,
        MONGODB_URI: uri,
        MONGODB_DB: backendState.dbName,
        BOT_TOKEN: TEST_BOT_TOKEN,
        CORS_ORIGIN: clientUrl,
        PORT: String(backendState.port),
        NODE_ENV: 'test',
      },
      stdio: 'inherit',
    })

    await waitHealth(`${backendState.baseURL}/health`, backend)

    await run('npm', ['run', 'build'], clientRoot, {
      ...process.env,
      VITE_API_URL: `${backendState.baseURL}/api`,
    })

    client = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(clientPort)], {
      cwd: clientRoot,
      env: process.env,
      stdio: 'inherit',
    })

    await waitUrl(clientUrl, client)
    writeFileSync(backendState.stateFile, JSON.stringify({ baseURL: clientUrl }))
    process.env[UI_E2E_STATE_ENV] = backendState.stateFile
    return cleanup
  } catch (err) {
    await db?.connection.close().catch(() => undefined)
    await cleanup()
    throw err
  }
}
