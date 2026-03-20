interface QuotaBadgeProps {
  free: number
  paid: number
}

export function QuotaBadge({ free, paid }: QuotaBadgeProps) {
  const total = free + paid
  const color = total === 0 ? 'bg-red-100 text-red-600' : 'bg-sky/50 text-ocean'

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      <span>🎮</span>
      <span>{total} 局</span>
    </span>
  )
}
