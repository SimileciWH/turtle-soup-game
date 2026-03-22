import type { Request, Response } from 'express'
import * as puzzleService from '../services/puzzleService'
import * as quotaService from '../services/quotaService'

export async function handleList(req: Request, res: Response): Promise<void> {
  const difficulty = String(req.query['difficulty'] ?? 'all')
  const page = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10))
  const limit = Math.min(200, Math.max(1, parseInt(String(req.query['limit'] ?? '100'), 10)))

  const { puzzles, total } = await puzzleService.listPuzzles(difficulty, page, limit)
  res.json({ puzzles, total, page, limit })
}

export async function handleDaily(_req: Request, res: Response): Promise<void> {
  const puzzle = await puzzleService.getDailyPuzzle()
  res.json({ puzzle })
}

export async function handleRate(req: Request, res: Response): Promise<void> {
  const puzzleId = parseInt(String(req.params['id'] ?? ''), 10)
  if (isNaN(puzzleId)) { res.status(400).json({ error: 'INVALID_INPUT', message: '无效的题目 ID', data: null }); return }
  const { rating, comment } = req.body as { rating: unknown; comment?: unknown }
  if (typeof rating !== 'number') { res.status(400).json({ error: 'INVALID_INPUT', message: '评分必须为数字', data: null }); return }
  const user = await quotaService.resolveUser(req.user!)
  await puzzleService.ratePuzzle(puzzleId, user.id, rating, typeof comment === 'string' ? comment : undefined)
  const myRating = await puzzleService.getMyRating(puzzleId, user.id)
  res.json({ ok: true, rating: myRating })
}

export async function handleGetOne(req: Request, res: Response): Promise<void> {
  const id = parseInt(String(req.params['id'] ?? ''), 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'INVALID_INPUT', message: '无效的题目 ID', data: null })
    return
  }
  const puzzle = await puzzleService.getPuzzleById(id)
  res.json({ puzzle })
}
