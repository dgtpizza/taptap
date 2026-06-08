import type { ClicksResponse, LeaderboardResponse, MeResponse } from '@shared/contract'
import { getInitData } from '@/shared/telegram'

const BASE = (import.meta.env.VITE_API_URL?.trim() || '/api').replace(/\/+$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('authorization', `tma ${getInitData()}`)
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json')

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
    throw new ApiError(body?.error?.message ?? `HTTP ${res.status}`, res.status)
  }
  return res.json() as Promise<T>
}

export const api = {
  me: (signal?: AbortSignal) => call<MeResponse>('/me', { signal }),
  clicks: (count: number, nonce: string, keepalive = false) =>
    call<ClicksResponse>('/clicks', { method: 'POST', body: JSON.stringify({ count, nonce }), keepalive }),
  leaderboard: (signal?: AbortSignal) => call<LeaderboardResponse>('/leaderboard', { signal }),
}
