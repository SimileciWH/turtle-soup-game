import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { authMiddleware } from '../middlewares/auth'
import * as ctrl from '../controllers/redeemController'

const router = Router()

router.use(authMiddleware)

router.post('/', asyncHandler(ctrl.handleRedeem))

export default router
