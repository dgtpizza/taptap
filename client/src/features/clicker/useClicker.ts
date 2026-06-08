import { useCallback, useEffect, useReducer, useRef } from 'react'
import { ENERGY_MAX, ENERGY_TICK_MS, FLUSH_MS, MAX_BATCH, REGEN_PER_SEC } from '@shared/constants'
import { regeneratedEnergy, type EnergySnapshot } from '@shared/energy'
import { api } from '@/shared/api'
import { errorMessage, isAbortError, reportError } from '@/shared/errors'
import { keys, t } from '@/shared/i18n'
import { getWebApp } from '@/shared/telegram'

type Snap = EnergySnapshot & { clicks: number }
type Status = 'loading' | 'ready' | 'error'
type Batch = { count: number; nonce: string }
type StoredQueue = { pending: number; inFlight: Batch | null }
type State = {
  snap: Snap
  status: Status
  error: string | null
  errorVersion: number
  pending: number
  inFlight: Batch | null
  tick: number
}
type Action =
  | { type: 'load:start' }
  | { type: 'load:success'; snap: Snap; queue?: StoredQueue | null }
  | { type: 'load:error'; error: string }
  | { type: 'tap' }
  | { type: 'flush:start'; batch: Batch }
  | { type: 'flush:success'; snap: Snap; accepted: number }
  | { type: 'flush:error'; error: string }
  | { type: 'tick' }

export type ClickerState = {
  status: Status
  clicks: number
  energy: number
  energyMax: number
  error: string | null
  errorVersion: number
  tap: (trusted: boolean) => void
  retry: () => void
}

const initialState: State = {
  snap: { clicks: 0, energy: 0, energyMax: ENERGY_MAX, regenPerSec: REGEN_PER_SEC, at: Date.now() },
  status: 'loading',
  error: null,
  errorVersion: 0,
  pending: 0,
  inFlight: null,
  tick: 0,
}

function queueKey(): string {
  return `cryptoclicker:clicker-queue:${getWebApp()?.initDataUnsafe.user?.id ?? 'dev'}`
}

function readStoredQueue(): StoredQueue | null {
  try {
    const raw = window.localStorage.getItem(queueKey())
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredQueue>
    const pending =
      typeof parsed.pending === 'number' && Number.isInteger(parsed.pending) && parsed.pending > 0
        ? parsed.pending
        : 0
    return {
      pending,
      inFlight:
        parsed.inFlight &&
        Number.isInteger(parsed.inFlight.count) &&
        parsed.inFlight.count > 0 &&
        typeof parsed.inFlight.nonce === 'string'
          ? { count: parsed.inFlight.count, nonce: parsed.inFlight.nonce }
          : null,
    }
  } catch {
    return null
  }
}

function persistQueue(state: State): void {
  try {
    if (state.pending <= 0 && state.inFlight === null) {
      window.localStorage.removeItem(queueKey())
      return
    }
    window.localStorage.setItem(
      queueKey(),
      JSON.stringify({ pending: state.pending, inFlight: state.inFlight } satisfies StoredQueue),
    )
  } catch {
    // Storage can be unavailable in private or constrained WebViews.
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'load:start':
      return { ...state, status: 'loading', error: null }
    case 'load:success':
      return {
        ...state,
        snap: action.snap,
        status: 'ready',
        error: null,
        pending: action.queue?.pending ?? state.pending,
        inFlight: action.queue?.inFlight ?? state.inFlight,
      }
    case 'load:error':
      return { ...state, status: 'error', error: action.error }
    case 'tap':
      return { ...state, pending: state.pending + 1, tick: state.tick + 1 }
    case 'flush:start':
      return { ...state, pending: Math.max(0, state.pending - action.batch.count), inFlight: action.batch }
    case 'flush:success': {
      const shortfall = state.inFlight ? Math.max(0, state.inFlight.count - action.accepted) : 0
      return {
        ...state,
        snap: action.snap,
        status: 'ready',
        error: null,
        pending: state.pending + shortfall,
        inFlight: null,
        tick: state.tick + 1,
      }
    }
    case 'flush:error':
      return {
        ...state,
        error: action.error,
        errorVersion: state.errorVersion + 1,
        tick: state.tick + 1,
      }
    case 'tick':
      return { ...state, tick: state.tick + 1 }
  }
}

function toSnap(r: { clicks: number; energy: number; energyMax: number; regenPerSec: number }): Snap {
  return { clicks: r.clicks, energy: r.energy, energyMax: r.energyMax, regenPerSec: r.regenPerSec, at: Date.now() }
}

function createNonce(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16))
    return `nonce-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
  }
  return `nonce-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 18)}`
}

function reserved(state: State): number {
  return state.pending + (state.inFlight?.count ?? 0)
}

function liveEnergy(state: State): number {
  return Math.max(0, regeneratedEnergy(state.snap) - reserved(state))
}

export function useClicker(): ClickerState {
  const [state, baseDispatch] = useReducer(reducer, initialState)
  const stateRef = useRef(state)
  const sendingRef = useRef(false)
  // One extra render after regen settles, so the meter lands on the cap, not cap-1.
  const animatingRef = useRef(false)

  const dispatch = useCallback((action: Action) => {
    stateRef.current = reducer(stateRef.current, action)
    if (action.type !== 'load:start' && action.type !== 'load:error') persistQueue(stateRef.current)
    baseDispatch(action)
  }, [])

  const loadMe = useCallback(
    (signal?: AbortSignal) => {
      dispatch({ type: 'load:start' })
      api
        .me(signal)
        .then((m) => dispatch({ type: 'load:success', snap: toSnap(m), queue: readStoredQueue() }))
        .catch((err: unknown) => {
          if (isAbortError(err)) return
          reportError(err, { area: 'clicker', action: 'load-me' })
          dispatch({ type: 'load:error', error: errorMessage(err, t(keys.couldNotLoadProfile)) })
        })
    },
    [dispatch],
  )

  useEffect(() => {
    const controller = new AbortController()
    loadMe(controller.signal)
    return () => controller.abort()
  }, [loadMe])

  const retry = useCallback(() => {
    loadMe()
  }, [loadMe])

  const flushPending = useCallback(
    (keepalive = false) => {
      if (sendingRef.current) return
      const current = stateRef.current
      let batch = current.inFlight
      if (!batch) {
        if (current.pending <= 0) return
        batch = { count: Math.min(current.pending, MAX_BATCH), nonce: createNonce() }
        dispatch({ type: 'flush:start', batch })
      }

      sendingRef.current = true
      api
        .clicks(batch.count, batch.nonce, keepalive)
        .then((r) => dispatch({ type: 'flush:success', snap: toSnap(r), accepted: r.accepted }))
        .catch((err: unknown) => {
          reportError(err, { area: 'clicker', action: 'flush-clicks' })
          dispatch({ type: 'flush:error', error: errorMessage(err, t(keys.couldNotSyncClicks)) })
        })
        .finally(() => {
          sendingRef.current = false
        })
    },
    [dispatch],
  )

  useEffect(() => {
    const tickId = setInterval(() => {
      const s = stateRef.current
      const animating = s.pending > 0 || s.inFlight !== null || liveEnergy(s) < s.snap.energyMax
      if (animating || animatingRef.current) dispatch({ type: 'tick' })
      animatingRef.current = animating
    }, ENERGY_TICK_MS)
    const flushId = setInterval(flushPending, FLUSH_MS)
    return () => {
      clearInterval(tickId)
      clearInterval(flushId)
    }
  }, [dispatch, flushPending])

  useEffect(() => {
    const flushWhenLeaving = () => flushPending(true)
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') flushPending(true)
    }
    window.addEventListener('pagehide', flushWhenLeaving)
    document.addEventListener('visibilitychange', flushWhenHidden)
    return () => {
      window.removeEventListener('pagehide', flushWhenLeaving)
      document.removeEventListener('visibilitychange', flushWhenHidden)
    }
  }, [flushPending])

  const tap = useCallback(
    (trusted: boolean) => {
      const current = stateRef.current
      if (current.status !== 'ready' || !trusted || liveEnergy(current) < 1) return
      dispatch({ type: 'tap' })
    },
    [dispatch],
  )

  return {
    status: state.status,
    clicks: Math.floor(state.snap.clicks + reserved(state)),
    energy: Math.floor(liveEnergy(state)),
    energyMax: state.snap.energyMax,
    error: state.error,
    errorVersion: state.errorVersion,
    tap,
    retry,
  }
}
