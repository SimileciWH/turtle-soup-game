export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const Errors = {
  INVALID_INPUT:          (msg = '输入不合法') => new AppError('INVALID_INPUT', msg, 400),
  INPUT_TOO_LONG:         () => new AppError('INPUT_TOO_LONG', '问题不能超过 3000 字', 400),
  BLOCKED_INPUT:          () => new AppError('BLOCKED_INPUT', '输入内容不合规', 400),
  UNAUTHORIZED:           () => new AppError('UNAUTHORIZED', '未登录或 token 失效', 401),
  QUOTA_EXHAUSTED:        () => new AppError('QUOTA_EXHAUSTED', '今日免费局数已用完，请兑换局数码后继续', 403),
  SESSION_NOT_ACTIVE:     () => new AppError('SESSION_NOT_ACTIVE', '游戏局状态不正确', 403),
  QUESTION_LIMIT_REACHED: () => new AppError('QUESTION_LIMIT_REACHED', '提问次数已达上限', 403),
  HINT_EXHAUSTED:         () => new AppError('HINT_EXHAUSTED', '提示次数已用完', 403),
  NOT_FOUND:              (msg = '资源不存在') => new AppError('NOT_FOUND', msg, 404),
  INVALID_CODE:           () => new AppError('INVALID_CODE', '兑换码无效', 400),
  USED_CODE:              () => new AppError('USED_CODE', '兑换码已被使用', 400),
  EXPIRED_CODE:           () => new AppError('EXPIRED_CODE', '兑换码已过期', 400),
  RATE_LIMITED:           () => new AppError('RATE_LIMITED', '请求频率超限', 429),
  AI_UNAVAILABLE:         () => new AppError('AI_UNAVAILABLE', 'AI 服务暂时不可用', 503),
  EMAIL_SEND_FAILED:      () => new AppError('EMAIL_SEND_FAILED', '验证码邮件发送失败', 503)
} as const
