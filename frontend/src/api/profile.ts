import { api } from './client'
import type { HistoryResponse, StatsResponse, SessionMessage } from '../types/api'

export function getHistory(page = 1, limit = 10) {
  return api.get<HistoryResponse>(`/profile/history?page=${page}&limit=${limit}`)
}

export function getStats() {
  return api.get<StatsResponse>('/profile/stats')
}

export function getSessionMessages(sessionId: string) {
  return api.get<{ messages: SessionMessage[] }>(`/profile/games/${sessionId}/messages`)
}
