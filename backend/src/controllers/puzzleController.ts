import type { Request, Response } from 'express'
import * as puzzleService from '../services/puzzleService'

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

export async function handleGetOne(req: Request, res: Response): Promise<void> {
  const id = parseInt(String(req.params['id'] ?? ''), 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'INVALID_INPUT', message: '无效的题目 ID', data: null })
    return
  }
  const puzzle = await puzzleService.getPuzzleById(id)
  res.json({ puzzle })
}
