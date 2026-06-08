import { describe, it, expect, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ClickerState } from '@/features/clicker/useClicker'
import { ClickerScreen } from '@/features/clicker/ClickerScreen'
import { ClickerStoreContext } from '@/features/clicker/ClickerProvider'

function state(over: Partial<ClickerState> = {}): ClickerState {
  return {
    status: 'ready',
    clicks: 1234,
    energy: 500,
    energyMax: 1000,
    error: null,
    unauthorized: false,
    errorVersion: 0,
    tap: vi.fn(),
    retry: vi.fn(),
    ...over,
  }
}

function renderScreen(over: Partial<ClickerState> = {}) {
  return render(
    <ClickerStoreContext.Provider value={state(over)}>
      <ClickerScreen />
    </ClickerStoreContext.Provider>,
  )
}

describe('ClickerScreen', () => {
  it('loading: shows skeleton without the Tap button', () => {
    renderScreen({ status: 'loading' })
    expect(screen.getByTestId('clicker-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('tap-button')).not.toBeInTheDocument()
  })

  it('error: shows StateMessage with Retry', async () => {
    const retry = vi.fn()
    renderScreen({ status: 'error', error: 'no profile', retry })

    expect(screen.getByTestId('state-title')).toHaveTextContent('Profile unavailable')
    expect(screen.getByTestId('state-body')).toHaveTextContent('We could not load your profile.')

    await userEvent.click(screen.getByTestId('state-action'))
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('ready: renders score, button, and energy meter', () => {
    renderScreen({ clicks: 4242, energy: 500, energyMax: 1000 })
    expect(screen.getByTestId('click-count')).toHaveTextContent((4242).toLocaleString('en-US'))
    expect(screen.getByTestId('tap-button')).toHaveAttribute('aria-disabled', 'false')
    expect(screen.getByTestId('energy-meter')).toHaveAttribute('aria-valuenow', '500')
  })

  it('ready + energy < 1: marks the button as aria-disabled', () => {
    renderScreen({ energy: 0 })
    expect(screen.getByTestId('tap-button')).toHaveAttribute('aria-disabled', 'true')
  })

  it('ready with energy: calls onTap through pointer interaction', async () => {
    const tap = vi.fn()
    renderScreen({ energy: 10, tap })

    await userEvent.pointer({ keys: '[MouseLeft]', target: screen.getByTestId('tap-button') })
    expect(tap).toHaveBeenCalled()
  })

  it('ready with a sync error: shows toast and hides it after 3 seconds', () => {
    vi.useFakeTimers()
    try {
      renderScreen({ error: 'Could not sync your clicks', errorVersion: 1 })
      expect(screen.getByTestId('tap-button')).toBeInTheDocument()
      expect(screen.getByTestId('sync-toast')).toHaveTextContent('Could not sync your clicks')

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(screen.queryByTestId('sync-toast')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
