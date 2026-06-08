import { type ChildProcess } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'

export type ServerHarnessState = {
  baseURL: string
  port: number
  dbName: string
  stateFile: string
}

export async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => {
        if (typeof address === 'object' && address) resolve(address.port)
        else reject(new Error('could not allocate a test port'))
      })
    })
  })
}

export function createHarnessState(prefix: string, port: number): ServerHarnessState {
  const dir = mkdtempSync(join(tmpdir(), `${prefix}-`))
  const dbName = `${prefix}_${process.pid}_${Date.now()}`
  return { baseURL: `http://127.0.0.1:${port}`, port, dbName, stateFile: join(dir, 'state.json') }
}

export async function waitHealth(url: string, child: ChildProcess, timeoutMs = 25_000): Promise<void> {
  let exit: { code: number | null; signal: NodeJS.Signals | null } | undefined
  child.once('exit', (code, signal) => {
    exit = { code, signal }
  })

  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (exit) throw new Error(`backend exited before healthcheck: code=${exit.code}, signal=${exit.signal}`)
    try {
      const r = await fetch(url)
      if (r.ok) return
    } catch {
      // The child process may need a few attempts before /health is reachable.
    }
    await new Promise((res) => setTimeout(res, 300))
  }
  throw new Error('backend did not become healthy')
}
