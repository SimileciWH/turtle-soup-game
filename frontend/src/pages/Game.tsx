import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { GameHeader } from '../components/game/GameHeader'
import { MessageList } from '../components/game/MessageList'
import { QuestionInput } from '../components/game/QuestionInput'
import { ActionBar } from '../components/game/ActionBar'
import { getSession, giveUp, submitAnswer, getHint, askStream } from '../api/games'
import type { SessionResponse } from '../types/api'

export function Game() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const store = useGameStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answerInput, setAnswerInput] = useState<string | null>(null)

  // Load or restore session on mount
  useEffect(() => {
    if (!id) return
    if (store.sessionId === Number(id) && store.status === 'active') {
      setLoading(false)
      return
    }
    loadSession(id)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadSession(sessionId: string) {
    try {
      const res: SessionResponse = await getSession(sessionId)
      store.startGame(Number(res.session_id), {
        id: res.puzzle_id,
        title: '',
        surface: res.surface,
        difficulty: 'medium'
      })
      store.setQuestionCount(res.question_count)
      store.setHintUsed(res.hint_used as 0 | 1 | 2 | 3)
      if (res.status !== 'ACTIVE') {
        navigate(`/result/${sessionId}`)
        return
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleAsk(question: string) {
    if (!id || store.isStreaming) return
    store.setStreaming(true)
    store.addMessage({ role: 'user', content: question })
    store.addMessage({ role: 'assistant', content: '' })

    try {
      for await (const event of askStream(id, question)) {
        if (event.type === 'delta') {
          store.appendToLastMessage(event.content)
        } else if (event.type === 'done') {
          store.setQuestionCount(event.question_count)
        } else if (event.type === 'error') {
          store.appendToLastMessage(`[错误: ${event.message}]`)
        }
      }
    } finally {
      store.setStreaming(false)
    }
  }

  async function handleHint() {
    if (!id || store.isStreaming) return
    try {
      const res = await getHint(id)
      store.addMessage({ role: 'assistant', content: `💡 提示：${res.hint}` })
      store.setHintUsed((store.hintUsed + 1) as 1 | 2 | 3)
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取提示失败')
    }
  }

  async function handleGiveUp() {
    if (!id || store.isStreaming) return
    if (!window.confirm('确定放弃？将揭晓答案。')) return
    try {
      await giveUp(id)
      store.setStatus('given_up')
      navigate(`/result/${id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败')
    }
  }

  function handleAnswerClick() {
    setAnswerInput('')
  }

  async function handleAnswerSubmit() {
    if (!id || answerInput === null || store.isStreaming) return
    const answer = answerInput.trim()
    if (!answer) return
    setAnswerInput(null)
    store.setStreaming(true)
    store.addMessage({ role: 'user', content: `[答案] ${answer}` })
    store.addMessage({ role: 'assistant', content: '' })

    try {
      const res = await submitAnswer(id, answer)
      // Replace the empty assistant message with the result
      store.appendToLastMessage(res.message)
      if (res.correct) {
        store.setStatus('won')
        setTimeout(() => navigate(`/result/${id}`), 2000)
      }
    } catch (e) {
      store.appendToLastMessage(`[错误: ${e instanceof Error ? e.message : '提交失败'}]`)
    } finally {
      store.setStreaming(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-warm-white flex items-center justify-center text-warm-mid">加载中…</div>
  }
  if (error) {
    return (
      <div className="min-h-screen bg-warm-white flex flex-col items-center justify-center gap-4">
        <div className="text-coral">{error}</div>
        <button onClick={() => navigate('/')} className="text-ocean underline text-sm">返回大厅</button>
      </div>
    )
  }

  const puzzle = store.puzzle
  const isDisabled = store.isStreaming || store.status !== 'active'

  return (
    <div className="min-h-screen bg-warm-white flex flex-col">
      <GameHeader
        title={puzzle?.title || `谜题 #${id}`}
        questionCount={store.questionCount}
        questionLimit={store.questionLimit}
        hintUsed={store.hintUsed}
      />

      {/* Surface / story card */}
      {puzzle && (
        <div className="max-w-2xl mx-auto w-full px-4 mt-4">
          <div className="bg-sky/20 border border-sky/60 rounded-2xl p-4 text-sm text-warm-brown leading-relaxed">
            <span className="font-semibold">📖 故事：</span>{puzzle.surface}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col px-4 mt-2 min-h-0">
        <MessageList messages={store.messages} isStreaming={store.isStreaming} />
      </div>

      {/* Answer modal input */}
      {answerInput !== null && (
        <div className="max-w-2xl mx-auto w-full px-4 mb-2">
          <div className="bg-white/90 border border-leaf/40 rounded-xl p-3 flex gap-2">
            <input
              type="text"
              value={answerInput}
              onChange={e => setAnswerInput(e.target.value)}
              placeholder="输入你的最终答案…"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAnswerSubmit()}
              className="flex-1 px-3 py-1.5 rounded-lg border border-sand/60 text-sm focus:outline-none focus:border-leaf"
            />
            <button onClick={handleAnswerSubmit} className="px-3 py-1.5 bg-leaf text-white rounded-lg text-sm">提交</button>
            <button onClick={() => setAnswerInput(null)} className="px-3 py-1.5 text-warm-mid text-sm">取消</button>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="max-w-2xl mx-auto w-full">
        <ActionBar
          hintUsed={store.hintUsed}
          disabled={isDisabled}
          onHint={handleHint}
          onAnswer={handleAnswerClick}
          onGiveUp={handleGiveUp}
        />
        <QuestionInput onSubmit={handleAsk} disabled={isDisabled} />
      </div>
    </div>
  )
}
