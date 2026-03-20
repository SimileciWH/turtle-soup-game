import type { Request, Response } from 'express'
import * as authService from '../services/authService'
import { Errors } from '../utils/AppError'

export async function handleGuest(_req: Request, res: Response): Promise<void> {
  const result = await authService.createGuest()
  res.json({
    guest_token: result.guestToken,
    quota_free: result.quotaFree,
    quota_paid: result.quotaPaid
  })
}

export async function handleSendEmail(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email?: string }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw Errors.INVALID_INPUT('请提供有效的邮箱地址')
  }
  await authService.sendEmailCode(email)
  res.json({ message: '验证码已发送，请查收邮件' })
}

export async function handleVerifyEmail(req: Request, res: Response): Promise<void> {
  const { email, code, guest_token } = req.body as {
    email?: string
    code?: string
    guest_token?: string
  }

  if (!email || !code) throw Errors.INVALID_INPUT('缺少 email 或 code')

  const { token } = await authService.verifyEmailCode(email, code, guest_token)
  res.json({ token })
}

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
