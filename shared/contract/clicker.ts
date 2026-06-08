export type MeResponse = {
  telegramId: number
  firstName: string
  clicks: number
  energy: number
  energyMax: number
  regenPerSec: number
}

// nonce makes a batch idempotent: a retried POST with the same nonce is not counted twice.
export type ClicksRequest = { count: number; nonce: string }

export type ClicksResponse = {
  clicks: number
  energy: number
  energyMax: number
  regenPerSec: number
  accepted: number
}
