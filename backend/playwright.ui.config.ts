import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src/test/ui-e2e',
  globalSetup: './src/test/ui-e2e/global-setup.ts',
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    headless: true,
    viewport: { width: 390, height: 844 },
  },
})
