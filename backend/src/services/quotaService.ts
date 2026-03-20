import { prisma } from '../utils/prisma'
import { Errors } from '../utils/AppError'
import type { AuthPayload } from '../middlewares/auth'
import type { User } from '@prisma/client'

export async function resolveUser(auth: AuthPayload): Promise<User> {
  let user: User | null = null

  if (auth.type === 'guest' && auth.guestToken) {
    user = await prisma.user.findUnique({ where: { guestToken: auth.guestToken } })
  } else {
    user = await prisma.user.findUnique({ where: { id: BigInt(auth.sub) } })
  }

  if (!user) throw Errors.UNAUTHORIZED()
  return user
}

export async function consumeQuota(userId: bigint): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw Errors.UNAUTHORIZED()

    const today = new Date().toISOString().slice(0, 10)
    const resetDate = user.quotaResetAt
      ? user.quotaResetAt.toISOString().slice(0, 10)
      : null

    let quotaFree = user.quotaFree
    if (resetDate !== today) {
      quotaFree = 3
      await tx.user.update({
        where: { id: userId },
        data: { quotaFree: 3, quotaResetAt: new Date(today) }
      })
    }

    if (quotaFree > 0) {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { quotaFree: { decrement: 1 } }
      })
      return updated.quotaFree + updated.quotaPaid
    }

    if (user.quotaPaid > 0) {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { quotaPaid: { decrement: 1 } }
      })
      return updated.quotaFree + updated.quotaPaid
    }

    throw Errors.QUOTA_EXHAUSTED()
  })
}

export async function getRemainingQuota(userId: bigint): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return 0

  const today = new Date().toISOString().slice(0, 10)
  const resetDate = user.quotaResetAt
    ? user.quotaResetAt.toISOString().slice(0, 10)
    : null
  const quotaFree = resetDate === today ? user.quotaFree : 3

  return quotaFree + user.quotaPaid
}
