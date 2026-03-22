import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { authMiddleware } from '../middlewares/auth'
import * as ctrl from '../controllers/puzzleController'

const router = Router()

router.get('/', asyncHandler(ctrl.handleList))
router.get('/daily', asyncHandler(ctrl.handleDaily))
router.get('/:id', asyncHandler(ctrl.handleGetOne))
router.post('/:id/rate', authMiddleware, asyncHandler(ctrl.handleRate))

export default router
