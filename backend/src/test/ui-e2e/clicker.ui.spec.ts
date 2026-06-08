import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import { signInitData } from '../helpers/initData'
import { TEST_BOT_TOKEN } from '../api-e2e/config'
import { UI_E2E_STATE_ENV } from './config'

// A fresh user (not in the seeded top-25) so the "your place" row is exercised.
const UI_USER = { id: 770001, first_name: 'UiTester' }

function baseUrl(): string {
  const stateFile = process.env[UI_E2E_STATE_ENV]
  if (!stateFile) throw new Error(`${UI_E2E_STATE_ENV} is not set`)
  return (JSON.parse(readFileSync(stateFile, 'utf8')) as { baseURL: string }).baseURL
}

test('tap persists on the backend and shows up on the leaderboard', async ({ page }) => {
  const initData = signInitData(UI_USER, TEST_BOT_TOKEN)
  // index.html loads the real telegram-web-app.js, which would overwrite any injected stub.
  // Replace that script with a stub that exposes valid signed initData (survives reloads too).
  const stub = `window.Telegram = {
    WebApp: {
      initData: ${JSON.stringify(initData)},
      initDataUnsafe: { user: { id: ${UI_USER.id}, first_name: ${JSON.stringify(UI_USER.first_name)}, language_code: "en" } },
      ready: function () {},
      expand: function () {},
      HapticFeedback: { impactOccurred: function () {} },
    },
  };`
  await page.route(/telegram-web-app\.js/, (route) =>
    route.fulfill({ contentType: 'application/javascript', body: stub }),
  )

  await page.goto(baseUrl())

  const coin = page.getByTestId('tap-button')
  await expect(coin).toBeVisible()
  for (let i = 0; i < 5; i++) await coin.click()

  await expect(page.getByTestId('click-count')).toHaveText('5')

  await page.waitForTimeout(1500)
  await page.reload()
  await expect(page.getByTestId('click-count')).toHaveText('5')

  await page.getByTestId('tab-leaders').click()
  await expect(page.getByTestId('your-rank-card')).toBeVisible()
})
