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

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ error: null }) }
  }))
}))

import { prisma } from '../utils/prisma'
import * as authService from '../services/authService'

const mockUser = {
  prisma: prisma.user as jest.Mocked<typeof prisma.user>
}
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('authService', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('createGuest', () => {
    it('creates a user with guestToken and returns it', async () => {
      mockUser.prisma.create.mockResolvedValue({
        guestToken: 'g_abc123',
        quotaFree: 3,
        quotaPaid: 0
      } as never)

      const result = await authService.createGuest()

      expect(mockUser.prisma.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ guestToken: expect.stringMatching(/^g_/) })
      })
      expect(result.quotaFree).toBe(3)
      expect(result.guestToken).toMatch(/^g_/)
    })
  })

  describe('verifyEmailCode', () => {
    it('throws INVALID_INPUT when OTP is wrong', async () => {
      await expect(authService.verifyEmailCode('test@example.com', '000000'))
        .rejects.toMatchObject({ code: 'INVALID_INPUT' })
    })

    it('creates new user when email not found', async () => {
      saveOtp('new@example.com', '123456')
      mockUser.prisma.findUnique.mockResolvedValue(null)
      mockUser.prisma.create.mockResolvedValue({
        id: BigInt(1), email: 'new@example.com',
        guestToken: null, quotaFree: 3, quotaPaid: 0,
        createdAt: new Date(), updatedAt: new Date(), quotaResetAt: null
      } as never)

      const { token } = await authService.verifyEmailCode('new@example.com', '123456')
      expect(token).toBeTruthy()
      expect(mockUser.prisma.create).toHaveBeenCalled()
    })

    it('returns JWT for existing user', async () => {
      saveOtp('existing@example.com', '654321')
      const existingUser = {
        id: BigInt(2), email: 'existing@example.com',
        guestToken: null, quotaFree: 3, quotaPaid: 0,
        createdAt: new Date(), updatedAt: new Date(), quotaResetAt: null
      }
      mockUser.prisma.findUnique.mockResolvedValue(existingUser as never)

      const { token } = await authService.verifyEmailCode('existing@example.com', '654321')
      expect(token).toBeTruthy()
      expect(mockUser.prisma.create).not.toHaveBeenCalled()
    })
  })

  describe('sendEmailCode', () => {
    it('saves OTP and calls Resend', async () => {
      await expect(authService.sendEmailCode('test@example.com')).resolves.not.toThrow()
    })
  })

  // BUG-005 regression tests
  describe('verifyEmailCode with guestToken — BUG-005', () => {
    const guestUser = {
      id: BigInt(10), email: null, guestToken: 'g_abc123',
      quotaFree: 3, quotaPaid: 0,
      createdAt: new Date(), updatedAt: new Date(), quotaResetAt: null
    }

    it('updates existing guest user with email instead of creating new user (prevents guestToken unique conflict)', async () => {
      saveOtp('first@example.com', '111111')
      // findUnique: email not found (null), then guestToken found
      mockUser.prisma.findUnique
        .mockResolvedValueOnce(null)        // email lookup → not found
        .mockResolvedValueOnce(guestUser as never) // guestToken lookup → guest exists
      mockUser.prisma.update.mockResolvedValue({
        ...guestUser, email: 'first@example.com'
      } as never)

      const { token } = await authService.verifyEmailCode('first@example.com', '111111', 'g_abc123')

      expect(token).toBeTruthy()
      // Must UPDATE the guest, not CREATE a new user (prevents unique constraint on guestToken)
      expect(mockUser.prisma.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: guestUser.id }, data: { email: 'first@example.com' } })
      )
      expect(mockUser.prisma.create).not.toHaveBeenCalled()
    })

    it('merges quota via $transaction when existing email user logs in with guestToken (prevents FK violation)', async () => {
      saveOtp('existing2@example.com', '222222')
      const existingEmailUser = {
        id: BigInt(20), email: 'existing2@example.com', guestToken: null,
        quotaFree: 3, quotaPaid: 1,
        createdAt: new Date(), updatedAt: new Date(), quotaResetAt: null
      }
      // findUnique: email found, then guestToken found for merge
      mockUser.prisma.findUnique
        .mockResolvedValueOnce(existingEmailUser as never) // email lookup → found
        .mockResolvedValueOnce(guestUser as never)          // guestToken lookup for merge
      mockPrisma.$transaction.mockResolvedValue([])

      const { token } = await authService.verifyEmailCode('existing2@example.com', '222222', 'g_abc123')

      expect(token).toBeTruthy()
      // Must use $transaction wrapping gameSession.updateMany before user.delete
      expect(mockPrisma.$transaction).toHaveBeenCalled()
      // gameSession.updateMany must be called to migrate sessions before deleting guest
      const gameSessionMock = (prisma.gameSession as jest.Mocked<typeof prisma.gameSession>)
      expect(gameSessionMock.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: guestUser.id } })
      )
    })
  })
})
