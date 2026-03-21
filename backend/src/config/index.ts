import path from 'path'
import dotenv from 'dotenv'

// 从项目根目录加载 .env（运行命令时 cwd 为 backend/）
dotenv.config({ path: path.resolve(process.cwd(), '../.env') })

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required env var: ${key}`)
  return value
}

export const config = {
  port: parseInt(process.env['PORT'] ?? '4000', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
  openai: {
    baseUrl: requireEnv('OPENAI_BASE_URL'),
    apiKey: requireEnv('OPENAI_API_KEY')
  },
  smtp: {
    host: requireEnv('SMTP_HOST'),
    port: parseInt(process.env['SMTP_PORT'] ?? '587', 10),
    user: requireEnv('SMTP_USER'),
    pass: requireEnv('SMTP_PASS')
  },
  corsOrigin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000'
} as const
