// API response types matching backend controllers

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

export interface Puzzle {
  id: number
  title: string
  summary: string
  surface: string
  difficulty: Difficulty
  tags: unknown
  isDaily: boolean
  playCount: number
  avgRating: number | null
  ratingCount: number
  createdAt: string
}

export interface PuzzleListResponse {
  puzzles: Puzzle[]
  total: number
  page: number
  limit: number
}

export interface StartGameResponse {
  session_id: string
  puzzle_id: number
  surface: string
  question_count: number
  question_limit: number
  hint_used: number
  quota_remaining: number
}

export interface SessionResponse {
  session_id: string
  puzzle_id: number
  surface: string
  status: 'ACTIVE' | 'WON' | 'GIVEN_UP'
  question_count: number
  question_limit: number
  hint_used: number
}

export interface ResultResponse {
  session_id: string
  status: 'WON' | 'GIVEN_UP'
  puzzle_id: number
  puzzle_title: string
  surface: string
  full_answer: string
  question_count: number
  hint_used: number
  duration_sec: number | null
  ended_at: string | null
}

export interface ProfileResponse {
  id: string
  email: string | null
  quota_free: number
  quota_paid: number
}

export interface HistorySession {
  session_id: string
  puzzle_title: string
  puzzle_difficulty: Difficulty
  status: 'WON' | 'GIVEN_UP' | 'ACTIVE'
  question_count: number
  hint_used: number
  duration_sec: number | null
  started_at: string
  ended_at: string | null
}

export interface HistoryResponse {
  sessions: HistorySession[]
  total: number
  page: number
  limit: number
}

export interface StatsResponse {
  total_games: number
  won_games: number
  win_rate: number
  avg_questions: number
  total_hints: number
  total_play_time_sec: number
  favorite_difficulty: 'EASY' | 'MEDIUM' | 'HARD' | null
}

export interface RedeemResponse {
  success: boolean
  quota_value: number
  quota_paid_total: number
}

export interface GuestResponse {
  guest_token: string
  quota_free: number
  quota_paid: number
}

export interface SessionMessage {
  role: 'user' | 'assistant'
  content: string
  seq: number
}
