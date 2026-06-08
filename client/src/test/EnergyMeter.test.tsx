import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EnergyMeter } from '@/features/clicker/ui/EnergyMeter'

describe('EnergyMeter', () => {
  it('renders the meter with aria-valuenow/min/max', () => {
    render(<EnergyMeter value={500} max={1000} />)
    const meter = screen.getByTestId('energy-meter')
    expect(meter).toHaveAttribute('aria-valuenow', '500')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '1000')
    expect(meter).toHaveAccessibleName('Energy')
  })

  it('shows "value / max" with comma grouping', () => {
    render(<EnergyMeter value={250} max={1000} />)
    expect(screen.getByTestId('energy-value')).toHaveTextContent('250 / 1,000')
  })

  it('shows recharging indicator when value < max', () => {
    render(<EnergyMeter value={0} max={1000} />)
    expect(screen.getByTestId('energy-recharging')).toBeInTheDocument()
  })

  it('hides recharging indicator when value === max', () => {
    render(<EnergyMeter value={1000} max={1000} />)
    expect(screen.queryByTestId('energy-recharging')).not.toBeInTheDocument()
  })

  it('sets progress width proportional to value / max', () => {
    render(<EnergyMeter value={300} max={1000} />)
    expect((screen.getByTestId('energy-fill') as HTMLElement).style.width).toBe('30%')
  })

  it('sets progress width to 0% when max is 0', () => {
    render(<EnergyMeter value={0} max={0} />)
    expect((screen.getByTestId('energy-fill') as HTMLElement).style.width).toBe('0%')
  })

  it('sets progress width to 100% at full energy', () => {
    render(<EnergyMeter value={1000} max={1000} />)
    expect((screen.getByTestId('energy-fill') as HTMLElement).style.width).toBe('100%')
  })
})
