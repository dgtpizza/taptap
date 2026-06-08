import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Mock } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ClicksResponse, MeResponse } from '@shared/contract'

vi.mock('@/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api')>()
  return { ...actual, api: { me: vi.fn(), clicks: vi.fn(), leaderboard: vi.fn() } }
})

import { api } from '@/shared/api'
import { useClicker } from '@/features/clicker/useClicker'

const meMock = api.me as unknown as Mock
const clicksMock = api.clicks as unknown as Mock

function me(over: Partial<MeResponse> = {}): MeResponse {
  return { telegramId: 1, firstName: 'A', clicks: 100, energy: 1000, energyMax: 1000, regenPerSec: 3, ...over }
}

function clicksResp(over: Partial<ClicksResponse> = {}): ClicksResponse {
  return { clicks: 100, energy: 1000, energyMax: 1000, regenPerSec: 3, accepted: 0, ...over }
}

beforeEach(() => {
  meMock.mockReset()
  clicksMock.mockReset()
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-0000-0000-000000000000')
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useClicker - profile loading', () => {
  it('starts loading and becomes ready after successful me()', async () => {
    meMock.mockResolvedValueOnce(me({ clicks: 250, energy: 800 }))
    const { result } = renderHook(() => useClicker())

    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.clicks).toBe(250)
    expect(result.current.energy).toBe(800)
    expect(result.current.energyMax).toBe(1000)
  })

  it('sets error status and message when me() fails', async () => {
    meMock.mockRejectedValueOnce(new Error('profile down'))
    const { result } = renderHook(() => useClicker())

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe('profile down')
  })

  it('retry() loads the profile again', async () => {
    meMock.mockRejectedValueOnce(new Error('down'))
    const { result } = renderHook(() => useClicker())
    await waitFor(() => expect(result.current.status).toBe('error'))

    meMock.mockResolvedValueOnce(me({ clicks: 5 }))
    await act(async () => {
      result.current.retry()
    })

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.clicks).toBe(5)
    expect(meMock).toHaveBeenCalledTimes(2)
  })
})

describe('useClicker - optimistic taps', () => {
  it('tap(true) increments visible clicks immediately', async () => {
    meMock.mockResolvedValueOnce(me({ clicks: 100, energy: 1000 }))
    const { result } = renderHook(() => useClicker())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    act(() => result.current.tap(true))
    expect(result.current.clicks).toBe(101)

    act(() => result.current.tap(true))
    expect(result.current.clicks).toBe(102)
  })

  it('ignores tap(false)', async () => {
    meMock.mockResolvedValueOnce(me({ clicks: 100, energy: 1000 }))
    const { result } = renderHook(() => useClicker())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    act(() => result.current.tap(false))
    expect(result.current.clicks).toBe(100)
  })

  it('ignores taps when energy is zero', async () => {
    meMock.mockResolvedValueOnce(me({ clicks: 100, energy: 0, regenPerSec: 0 }))
    const { result } = renderHook(() => useClicker())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    expect(result.current.energy).toBe(0)
    act(() => result.current.tap(true))
    expect(result.current.clicks).toBe(100)
  })

  it('does not allow tapping on fractional regeneration before a full server second', async () => {
    vi.useFakeTimers()
    meMock.mockResolvedValueOnce(me({ clicks: 100, energy: 0, regenPerSec: 3 }))
    const { result } = await mountReady()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(999)
    })
    expect(result.current.energy).toBe(0)

    act(() => result.current.tap(true))
    expect(result.current.clicks).toBe(100)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(result.current.energy).toBe(3)

    act(() => result.current.tap(true))
    expect(result.current.clicks).toBe(101)
  })

  it('ignores taps while loading', async () => {
    meMock.mockReturnValueOnce(new Promise(() => {}))
    const { result } = renderHook(() => useClicker())

    expect(result.current.status).toBe('loading')
    act(() => result.current.tap(true))
    expect(result.current.clicks).toBe(0)
  })

  it('spends visible energy for each accepted tap', async () => {
    meMock.mockResolvedValueOnce(me({ clicks: 100, energy: 1000, regenPerSec: 0 }))
    const { result } = renderHook(() => useClicker())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    const before = result.current.energy
    act(() => result.current.tap(true))
    expect(result.current.energy).toBe(before - 1)
  })
})

// Flush intervals are created on mount, so fake timers must be enabled before renderHook.
async function mountReady(): Promise<ReturnType<typeof renderHook<ReturnType<typeof useClicker>, unknown>>> {
  let hook!: ReturnType<typeof renderHook<ReturnType<typeof useClicker>, unknown>>
  await act(async () => {
    hook = renderHook(() => useClicker())
    await vi.advanceTimersByTimeAsync(0)
  })
  expect(hook.result.current.status).toBe('ready')
  return hook
}

describe('useClicker - batch flushing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('calls api.clicks with count and nonce on FLUSH_MS timer', async () => {
    meMock.mockResolvedValueOnce(me({ clicks: 100, energy: 1000 }))
    clicksMock.mockResolvedValue(clicksResp({ clicks: 103, accepted: 3 }))

    const { result } = await mountReady()

    act(() => result.current.tap(true))
    act(() => result.current.tap(true))
    act(() => result.current.tap(true))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(clicksMock).toHaveBeenCalledTimes(1)
    const [count, nonce] = clicksMock.mock.calls[0] as [number, string]
    expect(count).toBe(3)
    expect(typeof nonce).toBe('string')
    expect(nonce.length).toBeGreaterThan(0)
  })

  it('creates nonce through getRandomValues when randomUUID is unavailable', async () => {
    ;(crypto.randomUUID as unknown as Mock).mockRestore()
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.fill(7)
        return bytes
      },
    })
    meMock.mockResolvedValueOnce(me({ clicks: 100, energy: 1000 }))
    clicksMock.mockResolvedValue(clicksResp({ clicks: 101, accepted: 1 }))

    const { result } = await mountReady()
    act(() => result.current.tap(true))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    const [, nonce] = clicksMock.mock.calls[0] as [number, string]
    expect(nonce).toBe('nonce-07070707070707070707070707070707')
  })

  it('keeps visible clicks stable between flush:start and flush:success', async () => {
    meMock.mockResolvedValueOnce(me({ clicks: 100, energy: 1000 }))
    let resolveClicks: (r: ClicksResponse) => void = () => {}
    clicksMock.mockImplementationOnce(
      () =>
        new Promise<ClicksResponse>((res) => {
          resolveClicks = res
        }),
    )

    const { result } = await mountReady()

    act(() => result.current.tap(true))
    act(() => result.current.tap(true))
    expect(result.current.clicks).toBe(102)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(result.current.clicks).toBe(102)

    await act(async () => {
      resolveClicks(clicksResp({ clicks: 102, energy: 998, accepted: 2 }))
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(result.current.clicks).toBe(102)
  })

  it('does not call api.clicks when the buffer is empty', async () => {
    meMock.mockResolvedValueOnce(me({ clicks: 100, energy: 1000 }))
    await mountReady()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(clicksMock).not.toHaveBeenCalled()
  })

  it('keeps clicks after flush error and retries the same nonce', async () => {
    meMock.mockResolvedValueOnce(me({ clicks: 100, energy: 1000 }))
    clicksMock.mockRejectedValueOnce(new Error('sync fail'))
    clicksMock.mockResolvedValueOnce(clicksResp({ clicks: 102, accepted: 2 }))

    const { result } = await mountReady()

    act(() => result.current.tap(true))
    act(() => result.current.tap(true))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(result.current.error).toBe('sync fail')
    expect(result.current.errorVersion).toBeGreaterThan(0)
    expect(result.current.clicks).toBe(102)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(clicksMock).toHaveBeenCalledTimes(2)
    const firstNonce = (clicksMock.mock.calls[0] as [number, string])[1]
    const secondNonce = (clicksMock.mock.calls[1] as [number, string])[1]
    expect(secondNonce).toBe(firstNonce)
  })

  it('restores unsaved queue after reload', async () => {
    window.localStorage.setItem(
      'cryptoclicker:clicker-queue:dev',
      JSON.stringify({ pending: 2, inFlight: { count: 3, nonce: 'stored-batch' } }),
    )
    meMock.mockResolvedValueOnce(me({ clicks: 100, energy: 1000 }))
    clicksMock.mockResolvedValueOnce(clicksResp({ clicks: 103, accepted: 3 }))

    const { result } = await mountReady()
    expect(result.current.clicks).toBe(105)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(clicksMock).toHaveBeenCalledWith(3, 'stored-batch', false)
  })

  it('re-queues clicks the server did not accept so the total never regresses', async () => {
    meMock.mockResolvedValueOnce(me({ clicks: 100, energy: 1000 }))
    clicksMock.mockResolvedValue(clicksResp({ clicks: 101, energy: 0, accepted: 1 }))

    const { result } = await mountReady()
    act(() => result.current.tap(true))
    act(() => result.current.tap(true))
    act(() => result.current.tap(true))
    expect(result.current.clicks).toBe(103)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(result.current.clicks).toBe(103)
  })
})
