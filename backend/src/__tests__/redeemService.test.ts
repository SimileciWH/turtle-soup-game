jest.mock('../utils/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    redeemCode: {
      findUnique: jest.fn()
    },
    user: {
      update: jest.fn()
    }
  }
}))

import { prisma } from '../utils/prisma'
import * as redeemService from '../services/redeemService'

const mockTx = {
  redeemCode: { findUnique: jest.fn(), update: jest.fn() },
  user: { update: jest.fn() }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(prisma.$transaction as jest.Mock).mockImplementation(
    (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)
  )
})

const validCode = {
  id: 1,
  code: 'TEST-0001',
  quotaValue: 10,
  usedById: null,
  usedAt: null,
  expiresAt: null,
  createdAt: new Date()
}

describe('redeemService.redeemCode', () => {
  it('valid code: updates record and increments quota', async () => {
    mockTx.redeemCode.findUnique.mockResolvedValue(validCode)
    mockTx.redeemCode.update.mockResolvedValue({})
    mockTx.user.update.mockResolvedValue({})

    const result = await redeemService.redeemCode(BigInt(1), 'TEST-0001')

    expect(result).toBe(10)
    expect(mockTx.redeemCode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ usedById: BigInt(1) })
      })
    )
    expect(mockTx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { quotaPaid: { increment: 10 } }
      })
    )
  })

  it('invalid code: throws INVALID_CODE', async () => {
    mockTx.redeemCode.findUnique.mockResolvedValue(null)

    await expect(redeemService.redeemCode(BigInt(1), 'FAKE-0000'))
      .rejects.toMatchObject({ code: 'INVALID_CODE' })
  })

  it('already used code: throws USED_CODE', async () => {
    mockTx.redeemCode.findUnique.mockResolvedValue({
      ...validCode, usedById: BigInt(99)
    })

    await expect(redeemService.redeemCode(BigInt(1), 'TEST-0001'))
      .rejects.toMatchObject({ code: 'USED_CODE' })
  })

  it('expired code: throws EXPIRED_CODE', async () => {
    mockTx.redeemCode.findUnique.mockResolvedValue({
      ...validCode, expiresAt: new Date('2020-01-01')
    })

    await expect(redeemService.redeemCode(BigInt(1), 'TEST-0001'))
      .rejects.toMatchObject({ code: 'EXPIRED_CODE' })
  })

  it('future expiry is valid', async () => {
    mockTx.redeemCode.findUnique.mockResolvedValue({
      ...validCode, expiresAt: new Date('2099-12-31')
    })
    mockTx.redeemCode.update.mockResolvedValue({})
    mockTx.user.update.mockResolvedValue({})

    const result = await redeemService.redeemCode(BigInt(1), 'TEST-0001')
    expect(result).toBe(10)
  })
})
