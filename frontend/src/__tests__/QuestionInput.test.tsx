import { render, screen, fireEvent } from '@testing-library/react'
import { QuestionInput } from '../components/game/QuestionInput'

describe('QuestionInput', () => {
  it('calls onSubmit with trimmed question on button click', () => {
    const onSubmit = vi.fn()
    render(<QuestionInput onSubmit={onSubmit} disabled={false} />)

    const textarea = screen.getByPlaceholderText(/输入问题/)
    fireEvent.change(textarea, { target: { value: '  他是自杀的吗？  ' } })
    fireEvent.click(screen.getByText('提问'))

    expect(onSubmit).toHaveBeenCalledWith('他是自杀的吗？')
  })

  it('clears input after submit', () => {
    const onSubmit = vi.fn()
    render(<QuestionInput onSubmit={onSubmit} disabled={false} />)

    const textarea = screen.getByPlaceholderText(/输入问题/)
    fireEvent.change(textarea, { target: { value: '这个人死了吗？' } })
    fireEvent.click(screen.getByText('提问'))

    expect((textarea as HTMLTextAreaElement).value).toBe('')
  })

  it('does not call onSubmit when disabled', () => {
    const onSubmit = vi.fn()
    render(<QuestionInput onSubmit={onSubmit} disabled={true} />)

    const textarea = screen.getByPlaceholderText(/输入问题/)
    fireEvent.change(textarea, { target: { value: '有人受伤了吗？' } })
    fireEvent.click(screen.getByText('提问'))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submit button is disabled when input is empty', () => {
    render(<QuestionInput onSubmit={vi.fn()} disabled={false} />)
    expect(screen.getByText('提问')).toBeDisabled()
  })

  it('submits on Enter key (no shift)', () => {
    const onSubmit = vi.fn()
    render(<QuestionInput onSubmit={onSubmit} disabled={false} />)

    const textarea = screen.getByPlaceholderText(/输入问题/)
    fireEvent.change(textarea, { target: { value: '是男性吗？' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

    expect(onSubmit).toHaveBeenCalledWith('是男性吗？')
  })

  it('does not submit on Shift+Enter', () => {
    const onSubmit = vi.fn()
    render(<QuestionInput onSubmit={onSubmit} disabled={false} />)

    const textarea = screen.getByPlaceholderText(/输入问题/)
    fireEvent.change(textarea, { target: { value: '是男性吗？' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
