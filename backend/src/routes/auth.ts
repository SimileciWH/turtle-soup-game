import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { emailRateLimit } from '../middlewares/rateLimit'
import { authMiddleware } from '../middlewares/auth'
import * as ctrl from '../controllers/authController'

const router = Router()

// Guest
router.post('/guest', asyncHandler(ctrl.handleGuest))

// Registration
router.post('/register', emailRateLimit, asyncHandler(ctrl.handleRegister))
router.post('/register/verify', asyncHandler(ctrl.handleRegisterVerify))

// Login
router.post('/login', asyncHandler(ctrl.handleLogin))

// Forgot / Reset password
router.post('/password/forgot', emailRateLimit, asyncHandler(ctrl.handleForgotPassword))
router.post('/password/reset', asyncHandler(ctrl.handleResetPassword))

// Change password + delete account (authenticated)
router.post('/password/change', authMiddleware, asyncHandler(ctrl.handleChangePassword))
router.post('/account/delete-otp', authMiddleware, asyncHandler(ctrl.handleSendDeleteOtp))
router.delete('/account', authMiddleware, asyncHandler(ctrl.handleDeleteAccount))

// Profile
router.get('/me', authMiddleware, asyncHandler(ctrl.handleMe))

// 开发环境专用
if (process.env['NODE_ENV'] === 'development') {
  router.post('/dev-login', asyncHandler(ctrl.handleDevLogin))
  router.post('/dev-register-verify', asyncHandler(ctrl.handleDevRegisterVerify))
}

export default router
