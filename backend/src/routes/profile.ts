import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { authMiddleware } from '../middlewares/auth'
import * as ctrl from '../controllers/profileController'

const router = Router()

router.use(authMiddleware)

router.get('/', asyncHandler(ctrl.handleProfile))
router.get('/stats', asyncHandler(ctrl.handleStats))
router.get('/history', asyncHandler(ctrl.handleHistory))
router.get('/games/:id/messages', asyncHandler(ctrl.handleSessionMessages))

export default router
