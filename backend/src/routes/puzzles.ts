import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import * as ctrl from '../controllers/puzzleController'

const router = Router()

router.get('/', asyncHandler(ctrl.handleList))
router.get('/daily', asyncHandler(ctrl.handleDaily))
router.get('/:id', asyncHandler(ctrl.handleGetOne))

export default router
