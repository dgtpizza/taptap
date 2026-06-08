import { test as base, type APIRequestContext } from '@playwright/test'
import { readFileSync } from 'node:fs'

export const test = base.extend<{ api: APIRequestContext }>({
  api: async ({ playwright }, use) => {
    const stateFile = process.env.CRYPTOCLICKER_E2E_STATE_FILE
    if (!stateFile) throw new Error('CRYPTOCLICKER_E2E_STATE_FILE is not set')
    const { baseURL } = JSON.parse(readFileSync(stateFile, 'utf8')) as { baseURL: string }
    const ctx = await playwright.request.newContext({ baseURL })
    await use(ctx)
    await ctx.dispose()
  },
})

export { expect } from '@playwright/test'
