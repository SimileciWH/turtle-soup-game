import { useState, type KeyboardEvent } from 'react'

interface QuestionInputProps {
  onSubmit: (question: string) => void
  disabled: boolean
}

export function QuestionInput({ onSubmit, disabled }: QuestionInputProps) {
  const [value, setValue] = useState('')

  function handleSubmit() {
    const q = value.trim()
    if (!q || disabled) return
    onSubmit(q)
    setValue('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex gap-2 items-end p-3 bg-warm-white border-t border-sand/40">
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="输入问题（只能问是/否类问题）…"
        rows={2}
        className="flex-1 resize-none px-3 py-2 rounded-xl border border-sand/60 bg-white/80 text-sm
                   focus:outline-none focus:border-ocean disabled:opacity-50 leading-relaxed"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="px-4 py-2 bg-ocean text-white rounded-xl text-sm font-medium
                   disabled:opacity-50 hover:bg-ocean/80 transition-colors shrink-0"
      >
        提问
      </button>
    </div>
  )
}
