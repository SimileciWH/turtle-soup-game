interface ActionBarProps {
  hintUsed: number
  disabled: boolean
  onHint: () => void
  onAnswer: () => void
  onGiveUp: () => void
}

export function ActionBar({ hintUsed, disabled, onHint, onAnswer, onGiveUp }: ActionBarProps) {
  return (
    <div className="flex gap-2 px-3 pb-2 flex-wrap">
      <button
        onClick={onHint}
        disabled={disabled || hintUsed >= 3}
        className="flex-1 py-1.5 text-xs bg-sand/40 text-warm-brown rounded-lg
                   hover:bg-sand/60 disabled:opacity-40 transition-colors"
      >
        💡 提示 ({hintUsed}/3)
      </button>
      <button
        onClick={onAnswer}
        disabled={disabled}
        className="flex-1 py-1.5 text-xs bg-leaf/20 text-leaf rounded-lg
                   hover:bg-leaf/30 disabled:opacity-40 transition-colors"
      >
        ✅ 提交答案
      </button>
      <button
        onClick={onGiveUp}
        disabled={disabled}
        className="flex-1 py-1.5 text-xs bg-coral/10 text-coral rounded-lg
                   hover:bg-coral/20 disabled:opacity-40 transition-colors"
      >
        🏳️ 放弃
      </button>
    </div>
  )
}
