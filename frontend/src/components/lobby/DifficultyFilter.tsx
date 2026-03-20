const OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' }
] as const

interface DifficultyFilterProps {
  value: string
  onChange: (v: string) => void
}

export function DifficultyFilter({ value, onChange }: DifficultyFilterProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={[
            'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-ocean text-white'
              : 'bg-sky/40 text-warm-brown hover:bg-sky'
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
