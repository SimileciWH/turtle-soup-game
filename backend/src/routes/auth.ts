import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { emailRateLimit } from '../middlewares/rateLimit'
import { authMiddleware } from '../middlewares/auth'
import * as ctrl from '../controllers/authController'

const router = Router()

router.post('/guest', asyncHandler(ctrl.handleGuest))
router.post('/email/send', emailRateLimit, asyncHandler(ctrl.handleSendEmail))
router.post('/email/verify', asyncHandler(ctrl.handleVerifyEmail))
router.get('/me', authMiddleware, asyncHandler(ctrl.handleMe))

// 开发环境专用：绕过 OTP 直接获取 JWT（生产环境此路由不存在）
if (process.env['NODE_ENV'] === 'development') {
  router.post('/dev-login', asyncHandler(ctrl.handleDevLogin))
}

export default router
