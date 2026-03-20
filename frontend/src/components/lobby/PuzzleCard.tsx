import type { Puzzle } from '../../types/api'

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: '简单', MEDIUM: '中等', HARD: '困难'
}

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY: 'bg-leaf/20 text-leaf',
  MEDIUM: 'bg-sand/40 text-warm-brown',
  HARD: 'bg-coral/20 text-coral'
}

interface PuzzleCardProps {
  puzzle: Puzzle
  onStart: (puzzleId: number) => void
  loading: boolean
}

export function PuzzleCard({ puzzle, onStart, loading }: PuzzleCardProps) {
  return (
    <div className="bg-white/70 rounded-2xl border border-sand/40 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-warm-brown text-base leading-snug">{puzzle.title}</h3>
        {puzzle.isDaily && (
          <span className="shrink-0 text-xs bg-coral/20 text-coral px-2 py-0.5 rounded-full">每日</span>
        )}
      </div>

      <p className="text-sm text-warm-mid line-clamp-2 leading-relaxed">{puzzle.summary}</p>

      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${DIFFICULTY_COLOR[puzzle.difficulty] ?? ''}`}>
            {DIFFICULTY_LABEL[puzzle.difficulty] ?? puzzle.difficulty}
          </span>
          <span className="text-xs text-warm-mid">🎮 {puzzle.playCount}</span>
        </div>

        <button
          onClick={() => onStart(puzzle.id)}
          disabled={loading}
          className="px-4 py-1.5 bg-ocean text-white text-sm rounded-full hover:bg-ocean/80 disabled:opacity-50 transition-colors"
        >
          {loading ? '开始中…' : '开始游戏'}
        </button>
      </div>
    </div>
  )
}
