import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { authMiddleware } from '../middlewares/auth'
import { askRateLimit } from '../middlewares/rateLimit'
import { inputGuard } from '../middlewares/inputGuard'
import * as ctrl from '../controllers/gameController'

const router = Router()

// 所有游戏接口都需要认证
router.use(authMiddleware)

router.post('/', asyncHandler(ctrl.handleStart))
router.get('/:id', asyncHandler(ctrl.handleGetSession))
router.post('/:id/ask', askRateLimit, inputGuard, asyncHandler(ctrl.handleAsk))
router.post('/:id/hint', asyncHandler(ctrl.handleHint))
router.post('/:id/answer', asyncHandler(ctrl.handleAnswer))
router.post('/:id/giveup', asyncHandler(ctrl.handleGiveUp))
router.get('/:id/result', asyncHandler(ctrl.handleResult))

export default router
