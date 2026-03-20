import { Router } from 'express'
import { askRateLimit } from '../middlewares/rateLimit'
import { inputGuard } from '../middlewares/inputGuard'

const router = Router()

// POST /games — 开始新一局
router.post('/', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

// GET /games/:id — 获取当局信息
router.get('/:id', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

// POST /games/:id/ask — 提交提问（SSE 流式）
router.post('/:id/ask', askRateLimit, inputGuard, (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

// POST /games/:id/hint — 获取提示
router.post('/:id/hint', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

// POST /games/:id/answer — 提交最终答案
router.post('/:id/answer', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

// POST /games/:id/giveup — 放弃揭晓
router.post('/:id/giveup', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

// GET /games/:id/result — 结算数据
router.get('/:id/result', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

export default router
