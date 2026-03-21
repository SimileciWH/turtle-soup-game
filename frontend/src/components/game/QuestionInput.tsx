import { useState, type KeyboardEvent } from 'react'

const MAX_CHARS = 3000

interface QuestionInputProps {
  onSubmit: (question: string) => void
  disabled: boolean
}

export function QuestionInput({ onSubmit, disabled }: QuestionInputProps) {
  const [value, setValue] = useState('')

  const remaining = MAX_CHARS - value.length
  const isNearLimit = remaining <= 300
  const isAtLimit = remaining <= 0

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
    <div className="flex flex-col gap-1 p-3 pb-safe bg-warm-white border-t border-sand/40"
         style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <div className="flex gap-2 items-end">
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="输入问题（只能问是/否类问题）…"
          maxLength={MAX_CHARS}
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
      {isNearLimit && (
        <div className={`text-right text-xs pr-1 ${isAtLimit ? 'text-coral font-medium' : 'text-warm-mid'}`}>
          {value.length}/{MAX_CHARS}
        </div>
      )}
    </div>
  )
}
