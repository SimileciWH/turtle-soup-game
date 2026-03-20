import { Router } from 'express'

const router = Router()

// GET /puzzles — 题目列表
router.get('/', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

// GET /puzzles/daily — 今日推荐题
router.get('/daily', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

// GET /puzzles/:id — 单题信息（不含 answer/facts）
router.get('/:id', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

export default router
