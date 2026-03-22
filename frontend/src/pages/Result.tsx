import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShareCard } from '../components/result/ShareCard'
import { getResult, getMessages } from '../api/games'
import { ratePuzzle } from '../api/puzzles'
import { useAuthStore } from '../store/authStore'
import type { ResultResponse } from '../types/api'

type Message = { role: string; content: string }

export function Result() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isGuest } = useAuthStore()
  const [result, setResult] = useState<ResultResponse | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [myRating, setMyRating] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  const [ratingLoading, setRatingLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([getResult(id), getMessages(id)])
      .then(([res, msgRes]) => { setResult(res); setMessages(msgRes.messages) })
      .catch(e => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleRate(star: number) {
    if (!result || ratingLoading) return
    setMyRating(star)
    setRatingLoading(true)
    try {
      await ratePuzzle(result.puzzle_id, star, ratingComment || undefined)
      setRatingSubmitted(true)
    } catch { /* ignore */ }
    finally { setRatingLoading(false) }
  }

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
    } catch { /* fallback: nothing */ }
  }

  if (loading) return (
    <div className="min-h-dvh bg-warm-white flex items-center justify-center text-warm-mid">
      加载中…
    </div>
  )

  if (error || !result) return (
    <div className="min-h-dvh bg-warm-white flex flex-col items-center justify-center gap-4">
      <div className="text-coral">{error ?? '数据不存在'}</div>
      <Link to="/" className="text-ocean underline text-sm">返回大厅</Link>
    </div>
  )

  const won = result.status === 'WON'

  return (
    <div className="min-h-dvh bg-warm-white flex flex-col">
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

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-5">

        {/* ── 汤底揭晓（核心内容）── */}
        <div className="bg-white/80 rounded-2xl border border-sand/40 overflow-hidden">
          {/* Surface */}
          <div className="px-5 pt-5 pb-3">
            <div className="text-xs font-medium text-warm-mid mb-1.5 uppercase tracking-wide">汤面</div>
            <p className="text-sm text-warm-brown leading-relaxed">{result.surface}</p>
          </div>

          <div className="mx-5 border-t border-sand/40" />

          {/* Full answer */}
          <div className="px-5 pt-3 pb-5">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-medium text-warm-mid uppercase tracking-wide">汤底真相</span>
              {won && <span className="text-xs bg-leaf/20 text-leaf px-1.5 py-0.5 rounded-full">你猜对了！</span>}
            </div>
            <p className="text-sm text-warm-brown leading-relaxed whitespace-pre-wrap">
              {result.full_answer}
            </p>
          </div>
        </div>

        {/* Share card */}
        <ShareCard
          puzzleTitle={result.puzzle_title}
          status={result.status}
          questionCount={result.question_count}
          hintUsed={result.hint_used}
          durationSec={result.duration_sec}
        />

        {/* Rating */}
        <RatingBlock
          isGuest={isGuest}
          myRating={myRating}
          comment={ratingComment}
          setComment={setRatingComment}
          submitted={ratingSubmitted}
          loading={ratingLoading}
          onRate={handleRate}
          onNavigate={() => navigate('/auth')}
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

        {/* Stats */}
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
            {result.duration_sec != null && (
              <>
                <dt className="text-warm-mid">用时</dt>
                <dd className="text-warm-brown">{formatDuration(result.duration_sec)}</dd>
              </>
            )}
          </dl>
        </div>

        {/* Conversation history */}
        {messages.length > 0 && (
          <div className="bg-white/60 rounded-2xl border border-sand/40 overflow-hidden">
            <button
              onClick={() => setShowHistory(h => !h)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm
                         font-bold text-warm-brown hover:bg-sand/10 transition-colors"
            >
              <span>💬 对话记录（{messages.length} 条）</span>
              <span className="text-warm-mid text-xs">{showHistory ? '▲ 收起' : '▼ 展开'}</span>
            </button>
            {showHistory && (
              <div className="px-4 pb-4 flex flex-col gap-2 max-h-96 overflow-y-auto">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`text-xs rounded-xl px-3 py-2 leading-relaxed ${
                      m.role === 'USER'
                        ? 'bg-sky/20 text-ocean self-end max-w-[85%] text-right'
                        : 'bg-sand/20 text-warm-brown self-start max-w-[85%]'
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}

function RatingBlock({
  isGuest, myRating, comment, setComment, submitted, loading, onRate, onNavigate
}: {
  isGuest: boolean
  myRating: number
  comment: string
  setComment: (v: string) => void
  submitted: boolean
  loading: boolean
  onRate: (star: number) => void
  onNavigate: () => void
}) {
  if (isGuest) {
    return (
      <div className="bg-white/60 rounded-2xl border border-sand/40 p-4 text-center">
        <p className="text-sm text-warm-mid mb-2">注册账号后可评价谜题，游戏数据也不会丢失 🐢</p>
        <button
          onClick={onNavigate}
          className="px-4 py-1.5 bg-ocean text-white rounded-lg text-sm hover:bg-ocean/80 transition-colors"
        >
          去注册
        </button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="bg-white/60 rounded-2xl border border-sand/40 p-4 text-center text-sm text-leaf">
        ✅ 感谢你的评价！
      </div>
    )
  }

  return (
    <div className="bg-white/60 rounded-2xl border border-sand/40 p-4">
      <h3 className="font-bold text-warm-brown text-sm mb-3">给这道谜题评个分</h3>
      <div className="flex gap-2 justify-center mb-3">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => onRate(star)}
            disabled={loading}
            className={`text-2xl transition-transform hover:scale-110 disabled:opacity-50 ${
              star <= myRating ? 'opacity-100' : 'opacity-30'
            }`}
          >
            ⭐
          </button>
        ))}
      </div>
      {myRating > 0 && !submitted && (
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="留下简短评价（可选）"
          maxLength={200}
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-sand/60 bg-warm-white text-sm
                     focus:outline-none focus:border-ocean resize-none"
        />
      )}
    </div>
  )
}
