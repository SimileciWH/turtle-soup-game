import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShareCard } from '../components/result/ShareCard'
import { getResult } from '../api/games'
import type { ResultResponse } from '../types/api'

export function Result() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [result, setResult] = useState<ResultResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    getResult(id)
      .then(setResult)
      .catch(e => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleShare() {
    if (!result) return
    const won = result.status === 'WON'
    const text = [
      `🐢 海龟汤像素馆`,
      `谜题：${result.puzzle_title}`,
      won ? `🎉 推理成功！` : `汤底揭晓`,
      `提问数：${result.question_count} 问`,
      `使用提示：${result.hint_used} 次`,
      result.duration_sec ? `用时：${formatDuration(result.duration_sec)}` : '',
    ].filter(Boolean).join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: nothing
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center text-warm-mid">加载中…</div>
  )

  if (error || !result) return (
    <div className="min-h-screen bg-warm-white flex flex-col items-center justify-center gap-4">
      <div className="text-coral">{error ?? '数据不存在'}</div>
      <Link to="/" className="text-ocean underline text-sm">返回大厅</Link>
    </div>
  )

  const won = result.status === 'WON'

  return (
    <div className="min-h-screen bg-warm-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-warm-white/90 backdrop-blur border-b border-sand/40 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link to="/" className="text-sm text-warm-mid hover:text-warm-brown">← 大厅</Link>
          <span className="font-bold text-warm-brown">
            {won ? '🎉 推理成功' : '🏳️ 汤底揭晓'}
          </span>
          <div className="w-12" />
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {/* Share card */}
        <ShareCard
          puzzleTitle={result.puzzle_title}
          status={result.status}
          questionCount={result.question_count}
          hintUsed={result.hint_used}
          durationSec={result.duration_sec}
        />

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-2.5 bg-ocean text-white rounded-xl text-sm font-medium hover:bg-ocean/80 transition-colors"
          >
            {copied ? '✅ 已复制' : '📋 复制分享文字'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-2.5 bg-sand/40 text-warm-brown rounded-xl text-sm font-medium hover:bg-sand/60 transition-colors"
          >
            再来一局
          </button>
        </div>

        {/* Stats detail */}
        <div className="bg-white/60 rounded-2xl border border-sand/40 p-4">
          <h3 className="font-bold text-warm-brown mb-3 text-sm">本局统计</h3>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-warm-mid">谜题</dt>
            <dd className="text-warm-brown font-medium">{result.puzzle_title}</dd>
            <dt className="text-warm-mid">结果</dt>
            <dd className={won ? 'text-leaf font-medium' : 'text-warm-mid'}>
              {won ? '成功推理' : '已放弃'}
            </dd>
            <dt className="text-warm-mid">提问数</dt>
            <dd className="text-warm-brown">{result.question_count} 问</dd>
            <dt className="text-warm-mid">提示使用</dt>
            <dd className="text-warm-brown">{result.hint_used} / 3</dd>
            {result.duration_sec && (
              <>
                <dt className="text-warm-mid">用时</dt>
                <dd className="text-warm-brown">{formatDuration(result.duration_sec)}</dd>
              </>
            )}
          </dl>
        </div>
      </main>
    </div>
  )
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}
