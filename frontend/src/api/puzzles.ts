import { api } from './client'
import type { Puzzle, PuzzleListResponse } from '../types/api'

export function listPuzzles(difficulty: string, page = 1, limit = 100) {
  const params = new URLSearchParams({ difficulty, page: String(page), limit: String(limit) })
  return api.get<PuzzleListResponse>(`/puzzles?${params}`)
}

export function getDailyPuzzle() {
  return api.get<Puzzle>('/puzzles/daily')
}

export function ratePuzzle(puzzleId: number, rating: number, comment?: string) {
  return api.post<{ ok: boolean; rating: { rating: number; comment: string | null } | null }>(
    `/puzzles/${puzzleId}/rate`,
    { rating, comment }
  )
}
