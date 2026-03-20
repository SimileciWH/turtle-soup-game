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

export default router
