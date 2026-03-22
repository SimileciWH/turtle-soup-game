import { prisma } from '../utils/prisma'
import { Errors } from '../utils/AppError'
import type { Difficulty } from '@prisma/client'

export async function getProfile(userId: bigint) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw Errors.UNAUTHORIZED()

  return {
    id: user.id.toString(),
    email: user.email ?? null,
    quota_free: user.quotaFree,
    quota_paid: user.quotaPaid
  }
}

export async function getStats(userId: bigint) {
  const sessions = await prisma.gameSession.findMany({
    where: { userId, status: { in: ['WON', 'GIVEN_UP'] } },
    select: {
      status: true,
      questionCount: true,
      hintUsed: true,
      durationSec: true,
      puzzle: { select: { difficulty: true } }
    }
  })

  const won = sessions.filter(s => s.status === 'WON').length
  const total = sessions.length
  const avgQuestions = total > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.questionCount, 0) / total)
    : 0
  const totalHints = sessions.reduce((sum, s) => sum + s.hintUsed, 0)
  const totalTimeSec = sessions.reduce((sum, s) => sum + (s.durationSec ?? 0), 0)

  const diffCount: Record<string, number> = {}
  for (const s of sessions) {
    const d = s.puzzle.difficulty as Difficulty
    diffCount[d] = (diffCount[d] ?? 0) + 1
  }
  const favoriteDifficulty = Object.entries(diffCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    total_games: total,
    won_games: won,
    win_rate: total > 0 ? Math.round((won / total) * 100) : 0,
    avg_questions: avgQuestions,
    total_hints: totalHints,
    total_play_time_sec: totalTimeSec,
    favorite_difficulty: favoriteDifficulty
  }
}

export async function getSessionMessages(sessionId: bigint, userId: bigint) {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    select: { userId: true }
  })
  if (!session || session.userId !== userId) throw Errors.UNAUTHORIZED()

  return prisma.gameMessage.findMany({
    where: { sessionId },
    select: { role: true, content: true, seq: true },
    orderBy: { seq: 'asc' }
  })
}

export async function getHistory(userId: bigint, page: number, limit: number) {
  const [sessions, total] = await Promise.all([
    prisma.gameSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        status: true,
        questionCount: true,
        hintUsed: true,
        durationSec: true,
        startedAt: true,
        endedAt: true,
        puzzle: { select: { title: true, difficulty: true } }
      }
    }),
    prisma.gameSession.count({ where: { userId } })
  ])

  return {
    sessions: sessions.map(s => ({
      session_id: s.id.toString(),
      puzzle_title: s.puzzle.title,
      puzzle_difficulty: s.puzzle.difficulty,
      status: s.status,
      question_count: s.questionCount,
      hint_used: s.hintUsed,
      duration_sec: s.durationSec,
      started_at: s.startedAt,
      ended_at: s.endedAt
    })),
    total,
    page,
    limit
  }
}
