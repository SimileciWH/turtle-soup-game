import type { Request, Response } from 'express'
import * as authService from '../services/authService'
import { Errors } from '../utils/AppError'

// ── Guest ────────────────────────────────────────────────

export async function handleGuest(_req: Request, res: Response): Promise<void> {
  const result = await authService.createGuest()
  res.json({
    guest_token: result.guestToken,
    quota_free: result.quotaFree,
    quota_paid: result.quotaPaid
  })
}

// ── Registration ─────────────────────────────────────────

export async function handleRegister(req: Request, res: Response): Promise<void> {
  const { email, password, guest_token } = req.body as {
    email?: string
    password?: string
    guest_token?: string
  }
  if (!email || !password) throw Errors.INVALID_INPUT('缺少 email 或 password')

  await authService.register(email, password, guest_token)
  res.json({ sent: true })
}

export async function handleRegisterVerify(req: Request, res: Response): Promise<void> {
  const { email, code, guest_token } = req.body as {
    email?: string
    code?: string
    guest_token?: string
  }
  if (!email || !code) throw Errors.INVALID_INPUT('缺少 email 或 code')

  const { token } = await authService.verifyRegistration(email, code, guest_token)
  res.json({ token })
}

// ── Login ─────────────────────────────────────────────────

export async function handleLogin(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) throw Errors.INVALID_INPUT('缺少 email 或 password')

  const { token } = await authService.login(email, password)
  res.json({ token })
}

// ── Forgot / Reset Password ───────────────────────────────

export async function handleForgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email?: string }
  if (!email) throw Errors.INVALID_INPUT('缺少 email')

  await authService.forgotPassword(email)
  // Always return success to prevent email enumeration
  res.json({ message: '如果该邮箱已注册，验证码已发送' })
}

export async function handleResetPassword(req: Request, res: Response): Promise<void> {
  const { email, code, new_password } = req.body as {
    email?: string
    code?: string
    new_password?: string
  }
  if (!email || !code || !new_password) {
    throw Errors.INVALID_INPUT('缺少必要参数')
  }

  const { token } = await authService.resetPassword(email, code, new_password)
  res.json({ token })
}

// ── Change Password ───────────────────────────────────────

export async function handleChangePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Errors.UNAUTHORIZED()

  const { current_password, new_password } = req.body as {
    current_password?: string
    new_password?: string
  }
  if (!current_password || !new_password) throw Errors.INVALID_INPUT('缺少必要参数')

  await authService.changePassword(BigInt(req.user.sub), current_password, new_password)
  res.json({ message: '密码修改成功' })
}

// ── Delete Account ────────────────────────────────────────

export async function handleDeleteAccount(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Errors.UNAUTHORIZED()

  const { password } = req.body as { password?: string }
  if (!password) throw Errors.INVALID_INPUT('缺少 password')

  await authService.deleteAccount(BigInt(req.user.sub), password)
  res.json({ message: '账号已注销' })
}

// ── Profile ───────────────────────────────────────────────

export async function handleMe(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Errors.UNAUTHORIZED()

  if (req.user.type === 'guest') {
    const guestToken = (req.user as { guestToken?: string }).guestToken
    if (!guestToken) throw Errors.UNAUTHORIZED()
    const user = await authService.getUserByGuestToken(guestToken)
    if (!user) throw Errors.UNAUTHORIZED()
    res.json(formatUser(user, true))
    return
  }

  const user = await authService.getUserById(BigInt(req.user.sub))
  if (!user) throw Errors.UNAUTHORIZED()
  res.json(formatUser(user, false))
}

// 开发环境专用：跳过 OTP 直接完成注册验证（仅用于测试）
export async function handleDevRegisterVerify(req: Request, res: Response): Promise<void> {
  const { email, guest_token } = req.body as { email?: string; guest_token?: string }
  if (!email) throw Errors.INVALID_INPUT('缺少 email')

  const { saveOtp } = await import('../utils/otpStore')
  const testCode = 'dev999'
  saveOtp(`register:${email.toLowerCase()}`, testCode)
  const { token } = await authService.verifyRegistration(email, testCode, guest_token)
  res.json({ token })
}

// 开发环境专用
export async function handleDevLogin(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email?: string }
  if (!email) throw Errors.INVALID_INPUT('缺少 email')

  let user = await authService.getUserByEmail(email)
  if (!user) user = await authService.createUserByEmail(email)
  const token = authService.signJwt(user.id)
  res.json({ token })
}

function formatUser(
  user: { email: string | null; quotaFree: number; quotaPaid: number },
  isGuest: boolean
): object {
  return {
    email: user.email,
    is_guest: isGuest,
    quota_free: user.quotaFree,
    quota_paid: user.quotaPaid,
    quota_total: user.quotaFree + user.quotaPaid
  }
}
