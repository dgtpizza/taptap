import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CoinButton } from '@/features/clicker/ui/CoinButton'

describe('CoinButton', () => {
  it('renders a real button', () => {
    render(<CoinButton disabled={false} onTap={vi.fn()} />)
    expect(screen.getByTestId('tap-button').tagName).toBe('BUTTON')
  })

  it('calls onTap from pointerDown with boolean isTrusted', () => {
    const onTap = vi.fn()
    render(<CoinButton disabled={false} onTap={onTap} />)

    fireEvent.pointerDown(screen.getByTestId('tap-button'))

    expect(onTap).toHaveBeenCalledTimes(1)
    expect(typeof onTap.mock.calls[0]?.[0]).toBe('boolean')
  })

  it('disabled: marks aria-disabled and does not call onTap', () => {
    const onTap = vi.fn()
    render(<CoinButton disabled onTap={onTap} />)

    const btn = screen.getByTestId('tap-button')
    expect(btn).toHaveAttribute('aria-disabled', 'true')
    fireEvent.pointerDown(btn)

    expect(onTap).not.toHaveBeenCalled()
  })

  it('passes isTrusted=false for synthetic pointerDown', () => {
    const onTap = vi.fn()
    render(<CoinButton disabled={false} onTap={onTap} />)

    fireEvent.pointerDown(screen.getByTestId('tap-button'))

    expect(onTap).toHaveBeenCalledWith(false)
  })

  it('calls onTap for keyboard click', () => {
    const onTap = vi.fn()
    render(<CoinButton disabled={false} onTap={onTap} />)

    fireEvent.click(screen.getByTestId('tap-button'), { detail: 0 })

    expect(onTap).toHaveBeenCalledTimes(1)
  })
})
