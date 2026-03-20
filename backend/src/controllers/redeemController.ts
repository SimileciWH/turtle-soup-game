import type { Request, Response } from 'express'
import * as redeemService from '../services/redeemService'
import * as quotaService from '../services/quotaService'
import { Errors } from '../utils/AppError'

export async function handleRedeem(req: Request, res: Response): Promise<void> {
  const auth = req.user!

  // 仅登录用户可兑换，游客需先注册
  if (auth.type === 'guest') {
    throw Errors.UNAUTHORIZED()
  }

  const user = await quotaService.resolveUser(auth)
  const { code } = req.body as { code: string }

  if (!code || typeof code !== 'string') throw Errors.INVALID_INPUT('缺少 code 字段')

  const quotaValue = await redeemService.redeemCode(user.id, code.trim().toUpperCase())
  const remaining = await quotaService.getRemainingQuota(user.id)

  res.json({
    success: true,
    quota_value: quotaValue,
    quota_paid_total: remaining
  })
}
