import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Errors } from '../utils/AppError'

export interface AuthPayload {
  sub: string
  type: 'user' | 'guest'
  guestToken?: string
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
    req.user = { sub: '0', type: 'guest', guestToken: token }
    next()
    return
  }

  try {
    const secret = process.env['JWT_SECRET'] ?? ''
    const payload = jwt.verify(token, secret) as unknown as AuthPayload
    req.user = { sub: payload.sub, type: 'user' }
    next()
  } catch {
    throw Errors.UNAUTHORIZED()
  }
}
