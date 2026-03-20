import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/index'
import { Errors } from '../utils/AppError'

export interface AuthPayload {
  sub: number
  type: 'user' | 'guest'
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers['authorization']
  if (!header) throw Errors.UNAUTHORIZED()

  const token = header.replace(/^Bearer\s+/, '')

  if (token.startsWith('g_')) {
    req.user = { sub: 0, type: 'guest' }
    ;(req.user as AuthPayload & { guestToken: string }).guestToken = token as unknown as string
    next()
    return
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as unknown as AuthPayload
    req.user = payload
    next()
  } catch {
    throw Errors.UNAUTHORIZED()
  }
}
