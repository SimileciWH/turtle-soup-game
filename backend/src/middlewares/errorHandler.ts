import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.httpStatus).json({ error: err.code, message: err.message, data: null })
    return
  }

  console.error('[UnhandledError]', err)
  res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误', data: null })
}
