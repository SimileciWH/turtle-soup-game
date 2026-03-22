jest.mock('../utils/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn()
  }
}))

import { prisma } from '../utils/prisma'
import * as quotaService from '../services/quotaService'

const mockUserPrisma = prisma.user as jest.Mocked<typeof prisma.user>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

const today = new Date().toISOString().slice(0, 10)

const mockTx = {
  user: { findUnique: jest.fn(), update: jest.fn() }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(mockPrisma.$transaction as jest.Mock).mockImplementation(
    (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)
  )
})

function makeUser(overrides = {}) {
  return {
    id: BigInt(1),
    email: 'test@example.com',
    quotaFree: 3,
    quotaPaid: 0,
    quotaResetAt: new Date(today),
    ...overrides
  }
}

describe('consumeQuota', () => {
  it('deducts from quotaFree first', async () => {
    const user = makeUser({ quotaFree: 2, quotaPaid: 5 })
    mockTx.user.findUnique.mockResolvedValue(user)
    mockTx.user.update.mockResolvedValue({ quotaFree: 1, quotaPaid: 5 })

    const remaining = await quotaService.consumeQuota(BigInt(1))

    expect(remaining).toBe(6)
    expect(mockTx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quotaFree: { decrement: 1 } } })
    )
  })

  it('falls back to quotaPaid when quotaFree is 0', async () => {
    const user = makeUser({ quotaFree: 0, quotaPaid: 3 })
    mockTx.user.findUnique.mockResolvedValue(user)
    mockTx.user.update.mockResolvedValue({ quotaFree: 0, quotaPaid: 2 })

    const remaining = await quotaService.consumeQuota(BigInt(1))

    expect(remaining).toBe(2)
    expect(mockTx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quotaPaid: { decrement: 1 } } })
    )
  })

  it('throws QUOTA_EXHAUSTED when both quotas are 0', async () => {
    const user = makeUser({ quotaFree: 0, quotaPaid: 0 })
    mockTx.user.findUnique.mockResolvedValue(user)

    await expect(quotaService.consumeQuota(BigInt(1)))
      .rejects.toMatchObject({ code: 'QUOTA_EXHAUSTED' })
  })

  it('resets quotaFree to 3 when resetDate differs from today', async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const user = makeUser({ quotaFree: 0, quotaPaid: 0, quotaResetAt: new Date(yesterday) })
    mockTx.user.findUnique.mockResolvedValue(user)
    // First update: reset to 3, second: decrement
    mockTx.user.update
      .mockResolvedValueOnce({ quotaFree: 3, quotaPaid: 0 })  // reset call
      .mockResolvedValueOnce({ quotaFree: 2, quotaPaid: 0 })  // decrement call

    const remaining = await quotaService.consumeQuota(BigInt(1))

    expect(remaining).toBe(2)
    expect(mockTx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quotaFree: 3, quotaResetAt: expect.any(Date) } })
    )
  })

  it('does NOT reset when resetDate equals today', async () => {
    const user = makeUser({ quotaFree: 2, quotaResetAt: new Date(today) })
    mockTx.user.findUnique.mockResolvedValue(user)
    mockTx.user.update.mockResolvedValue({ quotaFree: 1, quotaPaid: 0 })

    await quotaService.consumeQuota(BigInt(1))

    // Only one update call (decrement), not two (no reset)
    expect(mockTx.user.update).toHaveBeenCalledTimes(1)
    expect(mockTx.user.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ quotaFree: 3 }) })
    )
  })
})

describe('getRemainingQuota', () => {
  it('returns quotaFree + quotaPaid when resetDate equals today', async () => {
    mockUserPrisma.findUnique.mockResolvedValue(makeUser({ quotaFree: 1, quotaPaid: 5 }) as never)

    const result = await quotaService.getRemainingQuota(BigInt(1))
    expect(result).toBe(6)
  })

  it('returns 3 + quotaPaid when resetDate differs (treats as new day)', async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    mockUserPrisma.findUnique.mockResolvedValue(
      makeUser({ quotaFree: 0, quotaPaid: 2, quotaResetAt: new Date(yesterday) }) as never
    )

    const result = await quotaService.getRemainingQuota(BigInt(1))
    expect(result).toBe(5) // 3 reset + 2 paid
  })

  it('returns 0 when user not found', async () => {
    mockUserPrisma.findUnique.mockResolvedValue(null)

    const result = await quotaService.getRemainingQuota(BigInt(999))
    expect(result).toBe(0)
  })
})
