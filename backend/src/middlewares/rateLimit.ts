import rateLimit from 'express-rate-limit'

export const askRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => String(req.user?.sub ?? req.ip),
  message: { error: 'RATE_LIMITED', message: '提问太频繁，请稍后再试', data: null }
})

export const emailRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  keyGenerator: (req) => String(req.body?.email ?? req.ip),
  message: { error: 'RATE_LIMITED', message: '发送太频繁，请稍后再试', data: null }
})
