import { render, screen } from '@testing-library/react'
import { QuotaBadge } from '../components/common/QuotaBadge'

describe('QuotaBadge', () => {
  it('displays total quota (free + paid)', () => {
    render(<QuotaBadge free={2} paid={3} />)
    expect(screen.getByText('5 局')).toBeInTheDocument()
  })

  it('shows red style when total is 0', () => {
    const { container } = render(<QuotaBadge free={0} paid={0} />)
    expect(container.firstChild).toHaveClass('bg-red-100')
  })

  it('shows blue style when total > 0', () => {
    const { container } = render(<QuotaBadge free={3} paid={0} />)
    expect(container.firstChild).toHaveClass('bg-sky/50')
  })

  it('renders 0 局 text when both are 0', () => {
    render(<QuotaBadge free={0} paid={0} />)
    expect(screen.getByText('0 局')).toBeInTheDocument()
  })
})
