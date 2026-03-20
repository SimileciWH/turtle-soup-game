import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { Resend } from 'resend'
import { prisma } from '../utils/prisma'
import { saveOtp, verifyOtp, generateOtpCode } from '../utils/otpStore'
import { Errors } from '../utils/AppError'
import type { User } from '@prisma/client'

const resend = new Resend(process.env['RESEND_API_KEY'])
const JWT_SECRET = process.env['JWT_SECRET'] ?? ''
const JWT_EXPIRES_IN = '30d'

// ── Guest ────────────────────────────────────────────────

export async function createGuest(): Promise<Pick<User, 'guestToken' | 'quotaFree' | 'quotaPaid'>> {
  const guestToken = 'g_' + crypto.randomBytes(16).toString('hex')
  const user = await prisma.user.create({ data: { guestToken } })
  return { guestToken: user.guestToken, quotaFree: user.quotaFree, quotaPaid: user.quotaPaid }
}

export async function getUserByGuestToken(token: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { guestToken: token } })
}

// ── Email OTP ────────────────────────────────────────────

export async function sendEmailCode(email: string): Promise<void> {
  const code = generateOtpCode()
  saveOtp(email, code)

  const { error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: '【海龟汤】登录验证码',
    html: `<p>你的验证码是：<strong style="font-size:24px">${code}</strong></p><p>5 分钟内有效，请勿泄露。</p>`
  })

  if (error) throw Errors.EMAIL_SEND_FAILED()
}

// ── Verify & Login ───────────────────────────────────────

export async function verifyEmailCode(
  email: string,
  code: string,
  guestToken?: string
): Promise<{ token: string; isNew: boolean }> {
  if (!verifyOtp(email, code)) {
    throw Errors.INVALID_INPUT('验证码错误或已过期')
  }

  let user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    user = await createUserFromEmail(email, guestToken)
  } else if (guestToken) {
    await mergeGuestQuota(user.id, guestToken)
  }

  const token = signJwt(user.id)
  return { token, isNew: !user.email }
}

async function createUserFromEmail(email: string, guestToken?: string): Promise<User> {
  const guest = guestToken
    ? await prisma.user.findUnique({ where: { guestToken } })
    : null

  return prisma.user.create({
    data: {
      email,
      guestToken: guestToken ?? null,
      quotaFree: guest?.quotaFree ?? 3,
      quotaPaid: guest?.quotaPaid ?? 0
    }
  })
}

async function mergeGuestQuota(userId: bigint, guestToken: string): Promise<void> {
  const guest = await prisma.user.findUnique({ where: { guestToken } })
  if (!guest || guest.id === userId) return

  await prisma.user.update({
    where: { id: userId },
    data: { quotaPaid: { increment: guest.quotaPaid } }
  })
  await prisma.user.delete({ where: { id: guest.id } })
}

// ── JWT ──────────────────────────────────────────────────

export function signJwt(userId: bigint): string {
  return jwt.sign({ sub: userId.toString(), type: 'user' }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

export async function getUserById(id: bigint): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } })
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } })
}

// 开发专用：直接按邮箱创建用户，无需 OTP
export async function createUserByEmail(email: string): Promise<User> {
  return prisma.user.create({ data: { email } })
}
