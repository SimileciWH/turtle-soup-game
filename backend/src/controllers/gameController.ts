import type { Request, Response } from 'express'
import * as gameService from '../services/gameService'
import * as quotaService from '../services/quotaService'
import * as puzzleService from '../services/puzzleService'
import * as aiService from '../services/aiService'
import { Errors } from '../utils/AppError'

// ── POST /games ───────────────────────────────────────────

export async function handleStart(req: Request, res: Response): Promise<void> {
  const auth = req.user!
  const user = await quotaService.resolveUser(auth)
  const { puzzle_id } = req.body as { puzzle_id: number }

  if (!puzzle_id) throw Errors.INVALID_INPUT('缺少 puzzle_id')

  const remaining = await quotaService.consumeQuota(user.id)
  const session = await gameService.createSession(user.id, puzzle_id)
  const puzzle = await puzzleService.getPuzzleById(puzzle_id)

  res.json({
    session_id: session.id.toString(),
    puzzle_id: session.puzzleId,
    surface: puzzle.surface,
    question_count: 0,
    question_limit: gameService.QUESTION_LIMIT,
    hint_used: 0,
    quota_remaining: remaining
  })
}

// ── GET /games/:id ────────────────────────────────────────

export async function handleGetSession(req: Request, res: Response): Promise<void> {
  const auth = req.user!
  const user = await quotaService.resolveUser(auth)
  const sessionId = BigInt(String(req.params['id'] ?? '0'))

  const session = await gameService.getSessionById(sessionId, user.id)
  const puzzle = await puzzleService.getPuzzleById(session.puzzleId)

  res.json({
    session_id: session.id.toString(),
    puzzle_id: session.puzzleId,
    surface: puzzle.surface,
    status: session.status,
    question_count: session.questionCount,
    question_limit: gameService.QUESTION_LIMIT,
    hint_used: session.hintUsed
  })
}

// ── POST /games/:id/ask (SSE) ─────────────────────────────

export async function handleAsk(req: Request, res: Response): Promise<void> {
  const auth = req.user!
  const user = await quotaService.resolveUser(auth)
  const sessionId = BigInt(String(req.params['id'] ?? '0'))
  const { question } = req.body as { question: string }

  if (!question) throw Errors.INVALID_INPUT('缺少 question 字段')

  const session = await gameService.getSessionById(sessionId, user.id)
  if (session.status !== 'ACTIVE') throw Errors.SESSION_NOT_ACTIVE()
  if (gameService.isAtQuestionLimit(session)) throw Errors.QUESTION_LIMIT_REACHED()

  const puzzle = await puzzleService.getFullPuzzle(session.puzzleId)
  const history = await gameService.getMessages(sessionId)
  await gameService.addMessage(sessionId, 'USER', question)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  let fullReply = ''
  try {
    for await (const delta of aiService.askStream({
      surface: puzzle.surface,
      answer: puzzle.answer,
      facts: puzzle.facts,
      history: history.map(m => ({
        role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
        content: m.content
      })),
      question
    })) {
      fullReply += delta
      res.write(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`)
    }
  } catch {
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI 服务暂时不可用' })}\n\n`)
    res.end()
    return
  }

  await gameService.addMessage(sessionId, 'ASSISTANT', fullReply)
  const newCount = await gameService.incrementQuestionCount(sessionId)

  res.write(`data: ${JSON.stringify({
    type: 'done',
    question_count: newCount,
    question_remaining: gameService.QUESTION_LIMIT - newCount
  })}\n\n`)
  res.end()
}

// ── POST /games/:id/hint ──────────────────────────────────

export async function handleHint(req: Request, res: Response): Promise<void> {
  const auth = req.user!
  const user = await quotaService.resolveUser(auth)
  const sessionId = BigInt(String(req.params['id'] ?? '0'))

  const hint = await gameService.getHint(sessionId, user.id)
  res.json({ hint })
}

// ── POST /games/:id/answer ────────────────────────────────

export async function handleAnswer(req: Request, res: Response): Promise<void> {
  const auth = req.user!
  const user = await quotaService.resolveUser(auth)
  const sessionId = BigInt(String(req.params['id'] ?? '0'))
  const { answer } = req.body as { answer: string }

  if (!answer) throw Errors.INVALID_INPUT('缺少 answer 字段')

  const session = await gameService.getSessionById(sessionId, user.id)
  if (session.status !== 'ACTIVE') throw Errors.SESSION_NOT_ACTIVE()

  const puzzle = await puzzleService.getFullPuzzle(session.puzzleId)
  const history = await gameService.getMessages(sessionId)

  let fullReply = ''
  try {
    for await (const delta of aiService.askStream({
      surface: puzzle.surface,
      answer: puzzle.answer,
      facts: puzzle.facts,
      history: history.map(m => ({
        role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
        content: m.content
      })),
      question: `[最终答案提交] ${answer}`
    })) {
      fullReply += delta
    }
  } catch {
    throw Errors.AI_UNAVAILABLE()
  }

  const correct = fullReply.includes('恭喜你推理正确')
  if (correct) {
    await gameService.endSession(sessionId, 'WON')
    res.json({ correct: true, message: fullReply, full_answer: puzzle.answer })
  } else {
    res.json({ correct: false, message: fullReply })
  }
}

// ── POST /games/:id/giveup ────────────────────────────────

export async function handleGiveUp(req: Request, res: Response): Promise<void> {
  const auth = req.user!
  const user = await quotaService.resolveUser(auth)
  const sessionId = BigInt(String(req.params['id'] ?? '0'))

  const session = await gameService.getSessionById(sessionId, user.id)
  if (session.status !== 'ACTIVE') throw Errors.SESSION_NOT_ACTIVE()

  const puzzle = await puzzleService.getFullPuzzle(session.puzzleId)
  await gameService.endSession(sessionId, 'GIVEN_UP')

  res.json({ full_answer: puzzle.answer, message: '已放弃，汤底已揭晓。' })
}

// ── GET /games/:id/result ─────────────────────────────────

export async function handleResult(req: Request, res: Response): Promise<void> {
  const auth = req.user!
  const user = await quotaService.resolveUser(auth)
  const sessionId = BigInt(String(req.params['id'] ?? '0'))

  const session = await gameService.getSessionById(sessionId, user.id)
  if (session.status === 'ACTIVE') throw Errors.SESSION_NOT_ACTIVE()

  const puzzle = await puzzleService.getPuzzleById(session.puzzleId)

  res.json({
    session_id: session.id.toString(),
    status: session.status,
    puzzle_id: session.puzzleId,
    puzzle_title: puzzle.title,
    question_count: session.questionCount,
    hint_used: session.hintUsed,
    duration_sec: session.durationSec,
    ended_at: session.endedAt
  })
}
