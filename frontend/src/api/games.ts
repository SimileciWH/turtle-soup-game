import { api } from './client'
import type { StartGameResponse, SessionResponse, ResultResponse } from '../types/api'

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
