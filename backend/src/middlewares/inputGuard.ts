import type { Request, Response, NextFunction } from 'express'

const BLOCKED_KEYWORDS = ['系统提示', 'system prompt', 'ignore previous', '忽略以上', 'ignore above']
const MAX_QUESTION_LENGTH = 3000

export function inputGuard(req: Request, res: Response, next: NextFunction): void {
  const question: unknown = req.body?.question
  if (typeof question !== 'string') {
    next()
    return
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    res.status(400).json({ error: 'INPUT_TOO_LONG', message: '问题不能超过 3000 字', data: null })
    return
  }

  const lower = question.toLowerCase()
  if (BLOCKED_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()))) {
    res.status(400).json({ error: 'BLOCKED_INPUT', message: '输入内容不合规', data: null })
    return
  }

  next()
}
