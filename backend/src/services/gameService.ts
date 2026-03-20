import { prisma } from '../utils/prisma'
import { Errors } from '../utils/AppError'
import type { GameSession, MessageRole } from '@prisma/client'

export const QUESTION_LIMIT = 60

export type MessageRecord = { role: MessageRole; content: string }

// ── Session ──────────────────────────────────────────────

export async function createSession(
  userId: bigint,
  puzzleId: number
): Promise<GameSession> {
  const puzzle = await prisma.puzzle.findUnique({
    where: { id: puzzleId, status: 'ACTIVE' },
    select: { id: true }
  })
  if (!puzzle) throw Errors.NOT_FOUND('题目不存在')

  return prisma.gameSession.create({
    data: { userId, puzzleId, status: 'ACTIVE' }
  })
}

export async function getSessionById(
  sessionId: bigint,
  userId: bigint
): Promise<GameSession> {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId }
  })
  if (!session || session.userId !== userId) throw Errors.NOT_FOUND('游戏局不存在')
  return session
}

export function isAtQuestionLimit(session: GameSession): boolean {
  return session.questionCount >= QUESTION_LIMIT
}

// ── Messages ─────────────────────────────────────────────

export async function getMessages(sessionId: bigint): Promise<MessageRecord[]> {
  return prisma.gameMessage.findMany({
    where: { sessionId },
    orderBy: { seq: 'asc' },
    select: { role: true, content: true }
  })
}

export async function addMessage(
  sessionId: bigint,
  role: MessageRole,
  content: string
): Promise<void> {
  const count = await prisma.gameMessage.count({ where: { sessionId } })
  await prisma.gameMessage.create({
    data: { sessionId, role, content, seq: count + 1 }
  })
}

export async function incrementQuestionCount(sessionId: bigint): Promise<number> {
  const updated = await prisma.gameSession.update({
    where: { id: sessionId },
    data: { questionCount: { increment: 1 } }
  })
  return updated.questionCount
}

// ── Hint ─────────────────────────────────────────────────

export async function getHint(
  sessionId: bigint,
  userId: bigint
): Promise<string> {
  const session = await getSessionById(sessionId, userId)
  if (session.status !== 'ACTIVE') throw Errors.SESSION_NOT_ACTIVE()
  if (session.hintUsed >= 3) throw Errors.HINT_EXHAUSTED()

  const puzzle = await prisma.puzzle.findUnique({
    where: { id: session.puzzleId },
    select: { hint1: true, hint2: true, hint3: true }
  })
  if (!puzzle) throw Errors.NOT_FOUND('题目不存在')

  const nextLevel = session.hintUsed + 1
  const hints = [puzzle.hint1, puzzle.hint2, puzzle.hint3]
  const hint = hints[nextLevel - 1] ?? ''

  await prisma.gameSession.update({
    where: { id: sessionId },
    data: { hintUsed: nextLevel }
  })

  return hint
}

// ── End Game ─────────────────────────────────────────────

export async function endSession(
  sessionId: bigint,
  status: 'WON' | 'GIVEN_UP'
): Promise<void> {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    select: { startedAt: true }
  })
  const durationSec = session
    ? Math.floor((Date.now() - session.startedAt.getTime()) / 1000)
    : 0

  await prisma.gameSession.update({
    where: { id: sessionId },
    data: { status, endedAt: new Date(), durationSec }
  })
}
