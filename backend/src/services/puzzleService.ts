import { prisma } from '../utils/prisma'
import { Errors } from '../utils/AppError'
import type { Difficulty } from '@prisma/client'

// 安全字段：永远不返回 answer / facts / hint1~3
const SAFE_SELECT = {
  id: true, title: true, summary: true, surface: true,
  difficulty: true, tags: true, isDaily: true,
  playCount: true, createdAt: true
} as const

// 内部完整字段（仅游戏引擎使用）
const FULL_SELECT = {
  ...SAFE_SELECT,
  answer: true, facts: true, hint1: true, hint2: true, hint3: true
} as const

export type SafePuzzle = {
  id: number; title: string; summary: string; surface: string
  difficulty: Difficulty; tags: unknown; isDaily: boolean
  playCount: number; createdAt: Date
}

export type FullPuzzle = SafePuzzle & {
  answer: string; facts: unknown; hint1: string; hint2: string; hint3: string
}

// ── Public API ──────────────────────────────────────────

export async function listPuzzles(
  difficulty: string,
  page: number,
  limit: number
): Promise<{ puzzles: SafePuzzle[]; total: number }> {
  const where = buildDifficultyFilter(difficulty)
  const [puzzles, total] = await Promise.all([
    prisma.puzzle.findMany({
      where,
      select: SAFE_SELECT,
      orderBy: [{ isDaily: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.puzzle.count({ where })
  ])
  return { puzzles, total }
}

export async function getDailyPuzzle(): Promise<SafePuzzle | null> {
  return prisma.puzzle.findFirst({
    where: { isDaily: true, status: 'ACTIVE' },
    select: SAFE_SELECT
  })
}

export async function getPuzzleById(id: number): Promise<SafePuzzle> {
  const puzzle = await prisma.puzzle.findUnique({
    where: { id },
    select: SAFE_SELECT
  })
  if (!puzzle) throw Errors.NOT_FOUND('题目不存在')
  return puzzle
}

// 仅供游戏引擎内部调用，包含汤底
export async function getFullPuzzle(id: number): Promise<FullPuzzle> {
  const puzzle = await prisma.puzzle.findUnique({
    where: { id, status: 'ACTIVE' },
    select: FULL_SELECT
  })
  if (!puzzle) throw Errors.NOT_FOUND('题目不存在')
  return puzzle
}

// ── Helpers ─────────────────────────────────────────────

function buildDifficultyFilter(difficulty: string) {
  if (difficulty && difficulty !== 'all') {
    const map: Record<string, Difficulty> = {
      easy: 'EASY', medium: 'MEDIUM', hard: 'HARD'
    }
    const d = map[difficulty]
    if (d) return { difficulty: d, status: 'ACTIVE' as const }
  }
  return { status: 'ACTIVE' as const }
}
