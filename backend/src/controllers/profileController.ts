import type { Request, Response } from 'express'
import * as profileService from '../services/profileService'
import * as quotaService from '../services/quotaService'

export async function handleProfile(req: Request, res: Response): Promise<void> {
  const user = await quotaService.resolveUser(req.user!)
  const profile = await profileService.getProfile(user.id)
  res.json(profile)
}

export async function handleSessionMessages(req: Request, res: Response): Promise<void> {
  const user = await quotaService.resolveUser(req.user!)
  const sessionId = BigInt(String(req.params['id'] ?? '0'))
  const messages = await profileService.getSessionMessages(sessionId, user.id)
  res.json({ messages })
}

export async function handleStats(req: Request, res: Response): Promise<void> {
  const user = await quotaService.resolveUser(req.user!)
  const stats = await profileService.getStats(user.id)
  res.json(stats)
}

export async function handleHistory(req: Request, res: Response): Promise<void> {
  const user = await quotaService.resolveUser(req.user!)
  const page = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10))
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query['limit'] ?? '20'), 10)))
  const result = await profileService.getHistory(user.id, page, limit)
  res.json(result)
}
