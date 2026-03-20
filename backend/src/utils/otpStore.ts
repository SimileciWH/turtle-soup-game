// 内存 OTP 存储，TTL 5 分钟
// MVP 阶段够用；生产升级可替换为 Redis

interface OtpEntry {
  code: string
  expiresAt: number
}

const store = new Map<string, OtpEntry>()
const OTP_TTL_MS = 5 * 60 * 1000

export function saveOtp(email: string, code: string): void {
  store.set(email.toLowerCase(), { code, expiresAt: Date.now() + OTP_TTL_MS })
}

export function verifyOtp(email: string, code: string): boolean {
  const entry = store.get(email.toLowerCase())
  if (!entry) return false
  if (Date.now() > entry.expiresAt) {
    store.delete(email.toLowerCase())
    return false
  }
  if (entry.code !== code) return false
  store.delete(email.toLowerCase())
  return true
}

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}
