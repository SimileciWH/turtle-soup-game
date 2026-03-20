import { prisma } from '../utils/prisma'
import { Errors } from '../utils/AppError'

export async function redeemCode(userId: bigint, code: string): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const record = await tx.redeemCode.findUnique({ where: { code } })

    if (!record) throw Errors.INVALID_CODE()
    if (record.usedById !== null) throw Errors.USED_CODE()
    if (record.expiresAt && record.expiresAt < new Date()) throw Errors.EXPIRED_CODE()

    await tx.redeemCode.update({
      where: { id: record.id },
      data: { usedById: userId, usedAt: new Date() }
    })

    await tx.user.update({
      where: { id: userId },
      data: { quotaPaid: { increment: record.quotaValue } }
    })

    return record.quotaValue
  })
}
