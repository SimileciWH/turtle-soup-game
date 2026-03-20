import { Router } from 'express'

const router = Router()

// GET /profile — 个人信息 + 余额
router.get('/', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

// GET /profile/history — 游戏历史记录
router.get('/history', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

export default router
