import { api } from './client'
import type { HistoryResponse } from '../types/api'

export function getHistory(page = 1, limit = 10) {
  return api.get<HistoryResponse>(`/profile/history?page=${page}&limit=${limit}`)
}
