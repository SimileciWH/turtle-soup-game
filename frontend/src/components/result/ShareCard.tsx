interface ShareCardProps {
  puzzleTitle: string
  status: 'WON' | 'GIVEN_UP'
  questionCount: number
  hintUsed: number
  durationSec: number | null
}

function formatDuration(sec: number | null): string {
  if (!sec) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}

export function ShareCard({ puzzleTitle, status, questionCount, hintUsed, durationSec }: ShareCardProps) {
  const won = status === 'WON'

  return (
    <div
      id="share-card"
      className="bg-warm-white border-2 border-sand rounded-2xl p-6 max-w-sm mx-auto shadow-md"
    >
      <div className="text-center mb-4">
        <div className="text-3xl mb-1">{won ? '🎉' : '🐢'}</div>
        <div className="font-bold text-warm-brown text-lg leading-snug">{puzzleTitle}</div>
        <div className={`mt-1 text-sm font-medium ${won ? 'text-leaf' : 'text-warm-mid'}`}>
          {won ? '推理成功！' : '汤底揭晓'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-sky/20 rounded-xl py-2">
          <div className="text-xl font-bold text-ocean">{questionCount}</div>
          <div className="text-xs text-warm-mid mt-0.5">提问数</div>
        </div>
        <div className="bg-sand/30 rounded-xl py-2">
          <div className="text-xl font-bold text-warm-brown">{hintUsed}</div>
          <div className="text-xs text-warm-mid mt-0.5">使用提示</div>
        </div>
        <div className="bg-leaf/10 rounded-xl py-2">
          <div className="text-xl font-bold text-leaf">{formatDuration(durationSec)}</div>
          <div className="text-xs text-warm-mid mt-0.5">用时</div>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-warm-mid">🐢 海龟汤像素馆</div>
    </div>
  )
}
