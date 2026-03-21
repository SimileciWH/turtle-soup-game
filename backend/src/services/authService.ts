import crypto from 'crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../utils/prisma'
import { saveOtp, verifyOtp, generateOtpCode } from '../utils/otpStore'
import { sendOtpEmail } from '../utils/emailService'
import { Errors } from '../utils/AppError'
import type { User } from '@prisma/client'

const JWT_SECRET = process.env['JWT_SECRET'] ?? ''
const JWT_EXPIRES_IN = '30d'
const BCRYPT_ROUNDS = 12
const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// OTP key namespaces to avoid collisions between register and reset flows
const OTP_KEY = {
  register: (email: string) => `register:${email.toLowerCase()}`,
  reset: (email: string) => `reset:${email.toLowerCase()}`
}

// ── Guest ────────────────────────────────────────────────

export async function createGuest(): Promise<Pick<User, 'guestToken' | 'quotaFree' | 'quotaPaid'>> {
  const guestToken = 'g_' + crypto.randomBytes(16).toString('hex')
  const user = await prisma.user.create({ data: { guestToken } })
  return { guestToken: user.guestToken, quotaFree: user.quotaFree, quotaPaid: user.quotaPaid }
}

export async function getUserByGuestToken(token: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { guestToken: token } })
}

// ── Registration ─────────────────────────────────────────

export async function register(
  email: string,
  password: string,
  guestToken?: string
): Promise<void> {
  if (!EMAIL_REGEX.test(email)) throw Errors.INVALID_EMAIL()
  if (password.length < 8) throw Errors.INVALID_PASSWORD()

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw Errors.EMAIL_ALREADY_EXISTS()

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  const guest = guestToken
    ? await prisma.user.findUnique({ where: { guestToken } })
    : null

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      emailVerified: false,
      quotaFree: guest?.quotaFree ?? 3,
      quotaPaid: guest?.quotaPaid ?? 0
    }
  })

  const code = generateOtpCode()
  saveOtp(OTP_KEY.register(email), code)
  await sendOtpEmail(email, code, '【海龟汤】邮箱验证码')
}

export async function verifyRegistration(
  email: string,
  code: string,
  guestToken?: string
): Promise<{ token: string }> {
  if (!verifyOtp(OTP_KEY.register(email), code)) {
    throw Errors.INVALID_OTP()
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw Errors.INVALID_OTP()

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true }
  })

  // merge guest quota if the guest was a different record
  if (guestToken && user.guestToken !== guestToken) {
    await mergeGuestQuota(user.id, guestToken)
  }

  return { token: signJwt(user.id) }
}

// ── Login ─────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<{ token: string }> {
  const user = await prisma.user.findUnique({ where: { email } })

  // Always do a dummy compare to prevent timing attacks
  const dummyHash = '$2b$12$invalidhashpadding000000000000000000000000000000000000000'
  if (!user || user.deletedAt) {
    await bcrypt.compare(password, dummyHash)
    throw Errors.INVALID_CREDENTIALS()
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw Errors.ACCOUNT_LOCKED(user.lockedUntil.toLocaleString('zh-CN'))
  }

  if (!user.emailVerified) throw Errors.EMAIL_NOT_VERIFIED()
  if (!user.passwordHash) throw Errors.PASSWORD_NOT_SET()

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    await handleFailedLogin(user)
    throw Errors.INVALID_CREDENTIALS()
  }

  // Reset attempt counter on success
  if (user.loginAttempts > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null }
    })
  }

  return { token: signJwt(user.id) }
}

async function handleFailedLogin(user: User): Promise<void> {
  const attempts = user.loginAttempts + 1
  const data = attempts >= MAX_LOGIN_ATTEMPTS
    ? { loginAttempts: attempts, lockedUntil: new Date(Date.now() + LOCK_DURATION_MS) }
    : { loginAttempts: attempts }
  await prisma.user.update({ where: { id: user.id }, data })
}

// ── Forgot / Reset Password ───────────────────────────────

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } })
  // Always succeed to prevent email enumeration
  if (!user || user.deletedAt) return

  const code = generateOtpCode()
  saveOtp(OTP_KEY.reset(email), code)
  await sendOtpEmail(email, code, '【海龟汤】密码重置验证码')
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<{ token: string }> {
  if (newPassword.length < 8) throw Errors.INVALID_PASSWORD()

  if (!verifyOtp(OTP_KEY.reset(email), code)) {
    throw Errors.INVALID_OTP()
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.deletedAt) throw Errors.INVALID_OTP()

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, loginAttempts: 0, lockedUntil: null, emailVerified: true }
  })

  return { token: signJwt(user.id) }
}

// ── Change Password ───────────────────────────────────────

export async function changePassword(
  userId: bigint,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 8) throw Errors.INVALID_PASSWORD()

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.passwordHash) throw Errors.INVALID_CREDENTIALS()

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) throw Errors.INVALID_CREDENTIALS()

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
}

// ── Delete Account (soft delete) ─────────────────────────

export async function deleteAccount(userId: bigint, password: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.passwordHash) throw Errors.INVALID_CREDENTIALS()

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw Errors.INVALID_CREDENTIALS()

  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date(), email: null, passwordHash: null }
  })
}

// ── Guest Quota Merge (internal) ─────────────────────────

async function mergeGuestQuota(userId: bigint, guestToken: string): Promise<void> {
  const guest = await prisma.user.findUnique({ where: { guestToken } })
  if (!guest || guest.id === userId) return

  await prisma.$transaction([
    prisma.gameSession.updateMany({
      where: { userId: guest.id },
      data: { userId }
    }),
    prisma.user.update({
      where: { id: userId },
      data: { quotaPaid: { increment: guest.quotaPaid } }
    }),
    prisma.user.delete({ where: { id: guest.id } })
  ])
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

// 开发环境专用
export async function createUserByEmail(email: string): Promise<User> {
  return prisma.user.create({ data: { email, emailVerified: true } })
}
