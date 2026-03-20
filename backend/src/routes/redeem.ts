import { Router } from 'express'

const router = Router()

// POST /redeem — 兑换码激活
router.post('/', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: '待实现' })
})

export default router
