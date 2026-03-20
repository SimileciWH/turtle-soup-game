import { api, BASE_URL } from './client'
import type { StartGameResponse, SessionResponse, ResultResponse } from '../types/api'

export type SseDelta = { type: 'delta'; content: string }
export type SseDone = { type: 'done'; question_count: number; question_remaining: number }
export type SseError = { type: 'error'; message: string }
export type SseEvent = SseDelta | SseDone | SseError

export async function* askStream(
  sessionId: string,
  question: string
): AsyncGenerator<SseEvent> {
  const token =
    localStorage.getItem('hgt_token') ?? localStorage.getItem('hgt_guest_token')
  const res = await fetch(`${BASE_URL}/games/${sessionId}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ question })
  })

  if (!res.ok || !res.body) {
    const err = (await res.json().catch(() => ({}))) as { message?: string }
    yield { type: 'error', message: err.message ?? '请求失败' }
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? ''
    for (const chunk of chunks) {
      if (chunk.startsWith('data: ')) {
        try {
          yield JSON.parse(chunk.slice(6)) as SseEvent
        } catch { /* skip malformed */ }
      }
    }
  }
}

export function startGame(puzzleId: number) {
  return api.post<StartGameResponse>('/games', { puzzle_id: puzzleId })
}

export function getSession(sessionId: string) {
  return api.get<SessionResponse>(`/games/${sessionId}`)
}

export function getResult(sessionId: string) {
  return api.get<ResultResponse>(`/games/${sessionId}/result`)
}

export function giveUp(sessionId: string) {
  return api.post<{ full_answer: string; message: string }>(`/games/${sessionId}/giveup`, {})
}

export function submitAnswer(sessionId: string, answer: string) {
  return api.post<{ correct: boolean; message: string; full_answer?: string }>(
    `/games/${sessionId}/answer`, { answer }
  )
}

export function getHint(sessionId: string) {
  return api.post<{ hint: string }>(`/games/${sessionId}/hint`, {})
}

export function getMessages(sessionId: string) {
  return api.get<{ messages: Array<{ role: string; content: string }> }>(
    `/games/${sessionId}/messages`
  )
}
