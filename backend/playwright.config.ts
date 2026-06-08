import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src/test/api-e2e',
  globalSetup: './src/test/api-e2e/global-setup.ts',
  workers: 1,
  fullyParallel: false,
  timeout: 30_000,
  reporter: 'list',
})
