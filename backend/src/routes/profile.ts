import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { authMiddleware } from '../middlewares/auth'
import * as ctrl from '../controllers/profileController'

const router = Router()

router.use(authMiddleware)

router.get('/', asyncHandler(ctrl.handleProfile))
router.get('/history', asyncHandler(ctrl.handleHistory))

export default router
