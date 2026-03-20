import { prisma } from '../utils/prisma'
import { Errors } from '../utils/AppError'

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
