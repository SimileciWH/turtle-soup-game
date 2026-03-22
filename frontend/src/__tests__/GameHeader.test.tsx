import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { GameHeader } from '../components/game/GameHeader'

function renderHeader(props: Parameters<typeof GameHeader>[0]) {
  return render(
    <MemoryRouter>
      <GameHeader {...props} />
    </MemoryRouter>
  )
}

describe('GameHeader progress bar', () => {
  it('displays puzzle title', () => {
    renderHeader({ title: '浴室里的女人', questionCount: 0, questionLimit: 20, hintUsed: 0 })
    expect(screen.getByText('浴室里的女人')).toBeInTheDocument()
  })

  it('shows remaining question count', () => {
    renderHeader({ title: 'Test', questionCount: 5, questionLimit: 20, hintUsed: 0 })
    expect(screen.getByText('剩余 15 问')).toBeInTheDocument()
  })

  it('shows hint used count', () => {
    renderHeader({ title: 'Test', questionCount: 0, questionLimit: 20, hintUsed: 2 })
    expect(screen.getByText('提示已用 2/3')).toBeInTheDocument()
  })

  it('progress bar width reflects question progress', () => {
    const { container } = renderHeader({
      title: 'Test', questionCount: 10, questionLimit: 20, hintUsed: 0
    })
    const bar = container.querySelector('[style*="width"]') as HTMLElement
    expect(bar?.style.width).toBe('50%')
  })

  it('progress bar is 0% at start', () => {
    const { container } = renderHeader({
      title: 'Test', questionCount: 0, questionLimit: 20, hintUsed: 0
    })
    const bar = container.querySelector('[style*="width"]') as HTMLElement
    expect(bar?.style.width).toBe('0%')
  })
})
