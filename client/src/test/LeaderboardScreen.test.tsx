import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import type { LeaderboardResponse } from '@shared/contract'

vi.mock('@/shared/api', () => ({
  api: { leaderboard: vi.fn() },
}))

import { api } from '@/shared/api'
import { LeaderboardProvider } from '@/features/leaderboard/LeaderboardProvider'
import { LeaderboardScreen } from '@/features/leaderboard/LeaderboardScreen'

const leaderboardMock = api.leaderboard as unknown as Mock

function response(over: Partial<LeaderboardResponse> = {}): LeaderboardResponse {
  return {
    top: [
      { rank: 1, telegramId: 1, firstName: 'Alice', clicks: 500 },
      { rank: 2, telegramId: 2, firstName: 'Bob', clicks: 300 },
    ],
    me: { rank: 9, clicks: 50, telegramId: 99 },
    ...over,
  }
}

function renderApp(path = '/leaderboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LeaderboardProvider>
        <Link to="/" data-testid="go-home">
          home
        </Link>
        <Link to="/leaderboard" data-testid="go-board">
          board
        </Link>
        <Routes>
          <Route path="/" element={<div data-testid="home" />} />
          <Route path="/leaderboard" element={<LeaderboardScreen />} />
        </Routes>
      </LeaderboardProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  leaderboardMock.mockReset()
})

describe('LeaderboardScreen', () => {
  it('loading: shows skeleton without data or error', () => {
    leaderboardMock.mockReturnValueOnce(new Promise(() => {}))
    renderApp()
    expect(screen.getByTestId('leaderboard-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('leaderboard-ready')).not.toBeInTheDocument()
    expect(screen.queryByTestId('state-title')).not.toBeInTheDocument()
  })

  it('error: shows StateMessage with Retry on rejection', async () => {
    leaderboardMock.mockRejectedValueOnce(new Error('boom'))
    renderApp()
    expect(await screen.findByTestId('state-title')).toHaveTextContent('Leaderboard unavailable')
    expect(screen.getByTestId('state-action')).toHaveTextContent('Retry')
  })

  it('error: Retry loads data again', async () => {
    leaderboardMock.mockRejectedValueOnce(new Error('boom'))
    renderApp()
    await screen.findByTestId('state-action')
    leaderboardMock.mockResolvedValueOnce(response())
    await userEvent.click(screen.getByTestId('state-action'))
    expect(await screen.findByTestId('leaderboard-ready')).toHaveTextContent('Alice')
    expect(leaderboardMock).toHaveBeenCalledTimes(2)
  })

  it('empty: shows "No players yet" for empty top', async () => {
    leaderboardMock.mockResolvedValueOnce(response({ top: [] }))
    renderApp()
    expect(await screen.findByTestId('empty-leaderboard')).toHaveTextContent('No players yet')
  })

  it('renders the player list', async () => {
    leaderboardMock.mockResolvedValueOnce(response())
    renderApp()
    const ready = await screen.findByTestId('leaderboard-ready')
    expect(ready).toHaveTextContent('Alice')
    expect(ready).toHaveTextContent('Bob')
  })

  it('renders YourRankCard when the current user is outside top', async () => {
    leaderboardMock.mockResolvedValueOnce(response({ me: { rank: 42, clicks: 17, telegramId: 99 } }))
    renderApp()
    expect(await screen.findByTestId('your-rank-card')).toHaveTextContent('#42')
  })

  it('marks the current user as "You" in top and hides the real name', async () => {
    leaderboardMock.mockResolvedValueOnce(
      response({
        top: [
          { rank: 1, telegramId: 1, firstName: 'Alice', clicks: 500 },
          { rank: 2, telegramId: 2, firstName: 'Bob', clicks: 300 },
          { rank: 3, telegramId: 3, firstName: 'Carol', clicks: 200 },
          { rank: 4, telegramId: 99, firstName: 'Zoe', clicks: 100 },
        ],
        me: { rank: 4, clicks: 100, telegramId: 99 },
      }),
    )
    renderApp()
    const ready = await screen.findByTestId('leaderboard-ready')
    expect(ready).toHaveTextContent('You')
    expect(ready).not.toHaveTextContent('Zoe')
  })

  it('keeps the board across navigation: re-entering the route shows it instantly, no skeleton', async () => {
    leaderboardMock.mockResolvedValue(response())
    renderApp()
    expect(await screen.findByTestId('leaderboard-ready')).toHaveTextContent('Alice')

    await userEvent.click(screen.getByTestId('go-home'))
    expect(screen.getByTestId('home')).toBeInTheDocument()
    expect(screen.queryByTestId('leaderboard-ready')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('go-board'))
    expect(screen.getByTestId('leaderboard-ready')).toHaveTextContent('Alice')
    expect(screen.queryByTestId('leaderboard-loading')).not.toBeInTheDocument()
  })
})
