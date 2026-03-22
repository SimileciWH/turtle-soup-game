import { saveOtp } from '../utils/otpStore'

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    gameSession: {
      updateMany: jest.fn()
    },
    $transaction: jest.fn()
  }
}))

// Mock bcrypt to avoid slow hashing in tests
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashedpassword'),
  compare: jest.fn().mockResolvedValue(true)
}))

// Mock emailService
jest.mock('../utils/emailService', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(undefined)
}))

import bcrypt from 'bcrypt'
import { prisma } from '../utils/prisma'
import { sendOtpEmail } from '../utils/emailService'
import * as authService from '../services/authService'

const mockUserPrisma = prisma.user as jest.Mocked<typeof prisma.user>
const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>
const mockSendOtpEmail = sendOtpEmail as jest.MockedFunction<typeof sendOtpEmail>

const baseUser = {
  id: BigInt(1),
  email: 'test@example.com',
  passwordHash: '$2b$12$hashedpassword',
  emailVerified: true,
  guestToken: null,
  quotaFree: 3,
  quotaPaid: 0,
  loginAttempts: 0,
  lockedUntil: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  quotaResetAt: null
}

describe('authService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── createGuest ───────────────────────────────────────────

  describe('createGuest', () => {
    it('creates a user with guestToken and returns it', async () => {
      mockUserPrisma.create.mockResolvedValue({
        guestToken: 'g_abc123',
        quotaFree: 3,
        quotaPaid: 0
      } as never)

      const result = await authService.createGuest()

      expect(mockUserPrisma.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ guestToken: expect.stringMatching(/^g_/) })
      })
      expect(result.quotaFree).toBe(3)
      expect(result.guestToken).toMatch(/^g_/)
    })
  })

  // ── register ──────────────────────────────────────────────

  describe('register', () => {
    it('throws INVALID_EMAIL for bad email format', async () => {
      await expect(authService.register('notanemail', 'password123'))
        .rejects.toMatchObject({ httpStatus: 400 })
    })

    it('throws INVALID_PASSWORD for short password', async () => {
      await expect(authService.register('test@example.com', 'short'))
        .rejects.toMatchObject({ httpStatus: 400 })
    })

    it('throws EMAIL_ALREADY_EXISTS when email is taken', async () => {
      mockUserPrisma.findUnique.mockResolvedValue(baseUser as never)

      await expect(authService.register('test@example.com', 'password123'))
        .rejects.toMatchObject({ httpStatus: 409 })
    })

    it('creates user and sends OTP email on success', async () => {
      mockUserPrisma.findUnique.mockResolvedValue(null)
      mockUserPrisma.create.mockResolvedValue(baseUser as never)

      await authService.register('new@example.com', 'password123')

      expect(mockUserPrisma.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@example.com',
            emailVerified: false
          })
        })
      )
      expect(mockSendOtpEmail).toHaveBeenCalledWith(
        'new@example.com',
        expect.any(String),
        expect.stringContaining('验证码')
      )
    })
  })

  // ── verifyRegistration ────────────────────────────────────

  describe('verifyRegistration', () => {
    it('throws INVALID_OTP when code is wrong', async () => {
      await expect(authService.verifyRegistration('test@example.com', '000000'))
        .rejects.toMatchObject({ httpStatus: 401 })
    })

    it('marks emailVerified=true and returns JWT on valid OTP', async () => {
      saveOtp('register:verify@example.com', '123456')
      mockUserPrisma.findUnique.mockResolvedValue({ ...baseUser, email: 'verify@example.com' } as never)
      mockUserPrisma.update.mockResolvedValue(baseUser as never)

      const { token } = await authService.verifyRegistration('verify@example.com', '123456')

      expect(token).toBeTruthy()
      expect(mockUserPrisma.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { emailVerified: true } })
      )
    })
  })

  // ── login ─────────────────────────────────────────────────

  describe('login', () => {
    it('throws EMAIL_NOT_FOUND when user not found (IMP-004)', async () => {
      mockUserPrisma.findUnique.mockResolvedValue(null)
      mockBcrypt.compare.mockResolvedValue(false as never)

      await expect(authService.login('unknown@example.com', 'password123'))
        .rejects.toMatchObject({ code: 'EMAIL_NOT_FOUND', httpStatus: 404 })
    })

    it('throws INVALID_CREDENTIALS for wrong password', async () => {
      mockUserPrisma.findUnique.mockResolvedValue(baseUser as never)
      mockBcrypt.compare.mockResolvedValue(false as never)
      mockUserPrisma.update.mockResolvedValue(baseUser as never)

      await expect(authService.login('test@example.com', 'wrongpass'))
        .rejects.toMatchObject({ httpStatus: 401 })
    })

    it('throws ACCOUNT_LOCKED when lockedUntil is in the future', async () => {
      const lockedUser = {
        ...baseUser,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000)
      }
      mockUserPrisma.findUnique.mockResolvedValue(lockedUser as never)

      await expect(authService.login('test@example.com', 'password123'))
        .rejects.toMatchObject({ httpStatus: 429 })
    })

    it('throws EMAIL_NOT_VERIFIED when emailVerified is false', async () => {
      mockUserPrisma.findUnique.mockResolvedValue(
        { ...baseUser, emailVerified: false } as never
      )

      await expect(authService.login('test@example.com', 'password123'))
        .rejects.toMatchObject({ httpStatus: 403 })
    })

    it('throws PASSWORD_NOT_SET when passwordHash is null', async () => {
      mockUserPrisma.findUnique.mockResolvedValue(
        { ...baseUser, passwordHash: null } as never
      )

      await expect(authService.login('test@example.com', 'password123'))
        .rejects.toMatchObject({ httpStatus: 403 })
    })

    it('returns JWT on valid credentials', async () => {
      mockUserPrisma.findUnique.mockResolvedValue(baseUser as never)
      mockBcrypt.compare.mockResolvedValue(true as never)

      const { token } = await authService.login('test@example.com', 'password123')

      expect(token).toBeTruthy()
    })

    it('increments loginAttempts on failed login', async () => {
      mockUserPrisma.findUnique.mockResolvedValue(baseUser as never)
      mockBcrypt.compare.mockResolvedValue(false as never)
      mockUserPrisma.update.mockResolvedValue(baseUser as never)

      await expect(authService.login('test@example.com', 'badpass')).rejects.toThrow()

      expect(mockUserPrisma.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ loginAttempts: 1 })
        })
      )
    })
  })

  // ── forgotPassword ────────────────────────────────────────

  describe('forgotPassword', () => {
    it('does nothing silently when user not found (anti-enumeration)', async () => {
      mockUserPrisma.findUnique.mockResolvedValue(null)

      await expect(authService.forgotPassword('unknown@example.com')).resolves.not.toThrow()
      expect(mockSendOtpEmail).not.toHaveBeenCalled()
    })

    it('sends reset OTP when user exists', async () => {
      mockUserPrisma.findUnique.mockResolvedValue(baseUser as never)

      await authService.forgotPassword('test@example.com')

      expect(mockSendOtpEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        expect.stringContaining('重置')
      )
    })
  })

  // ── resetPassword ─────────────────────────────────────────

  describe('resetPassword', () => {
    it('throws INVALID_PASSWORD for short new password', async () => {
      await expect(authService.resetPassword('test@example.com', '123456', 'short'))
        .rejects.toMatchObject({ httpStatus: 400 })
    })

    it('throws INVALID_OTP when code is wrong', async () => {
      await expect(authService.resetPassword('test@example.com', '000000', 'newpassword123'))
        .rejects.toMatchObject({ httpStatus: 401 })
    })

    it('resets password and returns JWT on valid OTP', async () => {
      saveOtp('reset:reset@example.com', '654321')
      mockUserPrisma.findUnique.mockResolvedValue(
        { ...baseUser, email: 'reset@example.com' } as never
      )
      mockUserPrisma.update.mockResolvedValue(baseUser as never)

      const { token } = await authService.resetPassword('reset@example.com', '654321', 'newpassword123')

      expect(token).toBeTruthy()
      expect(mockUserPrisma.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            loginAttempts: 0,
            lockedUntil: null,
            emailVerified: true
          })
        })
      )
    })
  })

  // ── BUG-005 regression: mergeGuestQuota ───────────────────

  describe('verifyRegistration with guestToken — BUG-005 regression', () => {
    const guestUser = {
      id: BigInt(10),
      email: null,
      guestToken: 'g_abc123',
      quotaFree: 3,
      quotaPaid: 0,
      emailVerified: false,
      passwordHash: null,
      loginAttempts: 0,
      lockedUntil: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      quotaResetAt: null
    }

    it('merges quota via $transaction when guestToken differs from registered user (prevents FK violation)', async () => {
      saveOtp('register:merge@example.com', '999888')
      const registeredUser = { ...baseUser, id: BigInt(20), email: 'merge@example.com', guestToken: null }

      mockUserPrisma.findUnique
        .mockResolvedValueOnce(registeredUser as never) // email lookup for verifyRegistration
        .mockResolvedValueOnce(guestUser as never)       // guestToken lookup in mergeGuestQuota

      mockUserPrisma.update.mockResolvedValue(registeredUser as never)
      mockPrisma.$transaction.mockResolvedValue([])

      const { token } = await authService.verifyRegistration('merge@example.com', '999888', 'g_abc123')

      expect(token).toBeTruthy()
      // Must use $transaction to atomically migrate sessions before deleting guest
      expect(mockPrisma.$transaction).toHaveBeenCalled()
      const gameSessionMock = prisma.gameSession as jest.Mocked<typeof prisma.gameSession>
      expect(gameSessionMock.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: guestUser.id } })
      )
    })

    // BUG-014 regression: mergeGuestQuota must copy ALL three quota fields
    it('BUG-014: copies quotaFree AND quotaResetAt (not just quotaPaid) from guest on merge', async () => {
      const today = new Date()
      const guestWithUsedQuota = {
        ...guestUser,
        id: BigInt(99),
        guestToken: 'g_bug014',
        quotaFree: 1,
        quotaPaid: 5,
        quotaResetAt: today
      }
      const registeredUser = { ...baseUser, id: BigInt(50), email: 'bug014@example.com', guestToken: null }

      saveOtp('register:bug014@example.com', '777777')
      mockUserPrisma.findUnique
        .mockResolvedValueOnce(registeredUser as never)      // email lookup
        .mockResolvedValueOnce(guestWithUsedQuota as never)  // guestToken lookup in mergeGuestQuota

      mockUserPrisma.update.mockResolvedValue(registeredUser as never)
      mockPrisma.$transaction.mockResolvedValue([])

      await authService.verifyRegistration('bug014@example.com', '777777', 'g_bug014')

      // The second update call is mergeGuestQuota's user.update (first is emailVerified=true)
      const calls = mockUserPrisma.update.mock.calls
      const mergeCall = calls.find(c =>
        (c[0] as { data: Record<string, unknown> }).data?.quotaFree !== undefined
      )
      expect(mergeCall).toBeDefined()
      expect(mergeCall![0]).toMatchObject({
        data: {
          quotaFree: 1,
          quotaResetAt: today,
          quotaPaid: { increment: 5 }
        }
      })
    })
  })
})
