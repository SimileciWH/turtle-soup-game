import { Router } from 'express'
import { emailRateLimit } from '../middlewares/rateLimit'

const router = Router()

// POST /auth/guest — 创建游客身份
router.post('/guest', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

// POST /auth/email/send — 发送验证码
router.post('/email/send', emailRateLimit, (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

// POST /auth/email/verify — 验证码校验，返回 JWT
router.post('/email/verify', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

// GET /auth/me — 获取当前用户信息
router.get('/me', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

export default router
