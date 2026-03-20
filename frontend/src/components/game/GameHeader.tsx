import { Link } from 'react-router-dom'

interface GameHeaderProps {
  title: string
  questionCount: number
  questionLimit: number
  hintUsed: number
}

export function GameHeader({ title, questionCount, questionLimit, hintUsed }: GameHeaderProps) {
  const remaining = questionLimit - questionCount
  const pct = Math.round((questionCount / questionLimit) * 100)

  return (
    <div className="px-4 py-3 bg-warm-white/90 backdrop-blur border-b border-sand/40">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <Link to="/" className="text-sm text-warm-mid hover:text-warm-brown">← 大厅</Link>
          <span className="font-bold text-warm-brown text-base">{title}</span>
          <span className="text-xs text-warm-mid">提示已用 {hintUsed}/3</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-sand/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-ocean rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-warm-mid whitespace-nowrap">
            剩余 {remaining} 问
          </span>
        </div>
      </div>
    </div>
  )
}
