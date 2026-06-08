import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Mock } from 'vitest'

vi.mock('@/shared/telegram', () => ({
  getInitData: vi.fn(() => 'INIT_DATA_123'),
}))

import { api, ApiError } from '@/shared/api'
import { getInitData } from '@/shared/telegram'

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  const ok = init.ok ?? true
  const status = init.status ?? (ok ? 200 : 500)
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  ;(getInitData as unknown as Mock).mockReturnValue('INIT_DATA_123')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api.call through public methods', () => {
  it('me() returns parsed JSON on success', async () => {
    const payload = { telegramId: 1, firstName: 'A', clicks: 10, energy: 5, energyMax: 1000, regenPerSec: 3 }
    fetchMock.mockResolvedValueOnce(jsonResponse(payload))

    const res = await api.me()

    expect(res).toEqual(payload)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('sets authorization: tma <initData>', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}))

    await api.me()

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Headers
    expect(headers.get('authorization')).toBe('tma INIT_DATA_123')
  })

  it('requests paths relative to /api', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}))

    await api.me()

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/me')
  })

  it('throws ApiError with status and error.message from response body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: { message: 'nope' } }, { ok: false, status: 403 }))

    const err = await api.me().catch((e: unknown) => e)

    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).message).toBe('nope')
    expect((err as ApiError).status).toBe(403)
  })

  it('falls back to HTTP <status> when body has no message', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }))

    const err = (await api.me().catch((e: unknown) => e)) as ApiError

    expect(err).toBeInstanceOf(ApiError)
    expect(err.message).toBe('HTTP 500')
    expect(err.status).toBe(500)
  })

  it('handles invalid JSON in error responses', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error('bad json')),
    } as unknown as Response)

    const err = (await api.me().catch((e: unknown) => e)) as ApiError

    expect(err).toBeInstanceOf(ApiError)
    expect(err.message).toBe('HTTP 502')
    expect(err.status).toBe(502)
  })
})

describe('api.clicks', () => {
  it('sends POST with {count, nonce} body and content-type', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ clicks: 1, energy: 1, energyMax: 1000, regenPerSec: 3, accepted: 5 }),
    )

    await api.clicks(5, 'nonce-abc')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/clicks')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ count: 5, nonce: 'nonce-abc' })
    expect((init.headers as Headers).get('content-type')).toBe('application/json')
  })

  it('defaults keepalive to false and forwards true when passed', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ clicks: 0, energy: 0, energyMax: 1000, regenPerSec: 3, accepted: 0 }))

    await api.clicks(1, 'n1')
    const first = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(first.keepalive).toBe(false)

    await api.clicks(1, 'n2', true)
    const second = fetchMock.mock.calls[1]?.[1] as RequestInit
    expect(second.keepalive).toBe(true)
  })
})

describe('api.leaderboard', () => {
  it('returns data and forwards AbortSignal', async () => {
    const payload = { top: [], me: { rank: 1, clicks: 0, telegramId: 1 } }
    fetchMock.mockResolvedValueOnce(jsonResponse(payload))
    const controller = new AbortController()

    const res = await api.leaderboard(controller.signal)

    expect(res).toEqual(payload)
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.signal).toBe(controller.signal)
  })
})
