import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { LeaderboardEntry } from '@shared/contract'
import { LeaderboardRow } from '@/features/leaderboard/ui/LeaderboardRow'
import { YourRankCard } from '@/features/leaderboard/ui/YourRankCard'

function entry(over: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return { rank: 1, telegramId: 42, firstName: 'Alice', clicks: 1234, ...over }
}

describe('LeaderboardRow', () => {
  it('shows rank, name, and score', () => {
    render(<LeaderboardRow entry={entry({ rank: 3, firstName: 'Bob', clicks: 9999 })} isMe={false} showDivider={false} />)
    expect(screen.getByTestId('row-rank')).toHaveTextContent('3')
    expect(screen.getByTestId('row-name')).toHaveTextContent('Bob')
    expect(screen.getByTestId('row-clicks')).toHaveTextContent('9,999')
  })

  it('does not apply accent highlight to regular rows', () => {
    render(<LeaderboardRow entry={entry()} isMe={false} showDivider={false} />)
    expect(screen.getByTestId('leaderboard-row').className).not.toContain('bg-accent-soft')
  })

  it('highlights the current user and shows "You" instead of firstName', () => {
    render(<LeaderboardRow entry={entry({ firstName: 'Me' })} isMe showDivider={false} />)
    expect(screen.getByTestId('leaderboard-row').className).toContain('bg-accent-soft')
    expect(screen.getByTestId('row-name')).toHaveTextContent('You')
    expect(screen.getByTestId('row-name')).not.toHaveTextContent('Me')
  })

  it('renders a divider for non-current-user rows', () => {
    render(<LeaderboardRow entry={entry()} isMe={false} showDivider />)
    expect(screen.getByTestId('row-divider')).toBeInTheDocument()
  })

  it('does not render a divider for the current-user row', () => {
    render(<LeaderboardRow entry={entry()} isMe showDivider />)
    expect(screen.queryByTestId('row-divider')).not.toBeInTheDocument()
  })
})

describe('YourRankCard', () => {
  it('shows rank, "You", and formatted score', () => {
    render(<YourRankCard rank={57} clicks={4200} />)
    const card = screen.getByTestId('your-rank-card')
    expect(card).toHaveTextContent('#57')
    expect(card).toHaveTextContent('You')
    expect(card).toHaveTextContent('4,200')
  })

  it('formats zero score as "0"', () => {
    render(<YourRankCard rank={1} clicks={0} />)
    const card = screen.getByTestId('your-rank-card')
    expect(card).toHaveTextContent('#1')
    expect(card).toHaveTextContent('0')
  })

  it('shows the current position hint', () => {
    render(<YourRankCard rank={3} clicks={100} />)
    expect(screen.getByTestId('your-rank-card')).toHaveTextContent('Your current position')
  })
})
