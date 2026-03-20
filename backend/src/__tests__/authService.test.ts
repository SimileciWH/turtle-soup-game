import { saveOtp } from '../utils/otpStore'

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
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
})
