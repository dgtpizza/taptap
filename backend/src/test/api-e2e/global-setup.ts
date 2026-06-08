import { spawn, type ChildProcess } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { MongoDBContainer, type StartedMongoDBContainer } from '@testcontainers/mongodb'
import { connectDb, type DbHandle } from '../../core/db'
import { createHarnessState, freePort, waitHealth } from '../helpers/serverHarness'
import { TEST_BOT_TOKEN, seedUsers } from './config'

const here = dirname(fileURLToPath(import.meta.url))
const backendRoot = join(here, '..', '..', '..')

let container: StartedMongoDBContainer | undefined
let server: ChildProcess | undefined

async function cleanup(): Promise<void> {
  server?.kill()
  await container?.stop()
}

export default async function globalSetup(): Promise<() => Promise<void>> {
  let db: DbHandle | undefined
  try {
    container = await new MongoDBContainer('mongo:7').start()
    const uri = `${container.getConnectionString()}?directConnection=true`
    const state = createHarnessState('cryptoclicker-api-e2e', await freePort())

    db = await connectDb(uri, state.dbName)
    const now = new Date()
    await db.User.insertMany(
      seedUsers.map((s) => ({
        _id: s.id,
        firstName: s.first_name,
        ...(s.username ? { username: s.username } : {}),
        clicks: s.clicks,
        energy: 100,
        energyAt: now,
        createdAt: now,
        lastVisitedAt: now,
      })),
    )
    await db.connection.close()
    db = undefined

    server = spawn(join(backendRoot, 'node_modules', '.bin', 'tsx'), ['src/server.ts'], {
      cwd: backendRoot,
      env: {
        ...process.env,
        MONGODB_URI: uri,
        MONGODB_DB: state.dbName,
        BOT_TOKEN: TEST_BOT_TOKEN,
        CORS_ORIGIN: 'http://127.0.0.1:5173',
        PORT: String(state.port),
        NODE_ENV: 'test',
      },
      stdio: 'inherit',
    })

    await waitHealth(`${state.baseURL}/health`, server)
    writeFileSync(state.stateFile, JSON.stringify({ baseURL: state.baseURL }))
    process.env.CRYPTOCLICKER_E2E_STATE_FILE = state.stateFile

    return cleanup
  } catch (err) {
    await db?.connection.close().catch(() => undefined)
    await cleanup()
    throw err
  }
}
