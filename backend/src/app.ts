import './config/index' // 加载 .env，必须最先导入
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import authRoutes from './routes/auth'
import puzzleRoutes from './routes/puzzles'
import gameRoutes from './routes/games'
import redeemRoutes from './routes/redeem'
import profileRoutes from './routes/profile'
import { errorHandler } from './middlewares/errorHandler'

const app = express()

app.use(helmet())

// 开发环境允许所有 localhost 端口（生产环境限定 CORS_ORIGIN）
const corsOrigin = process.env['NODE_ENV'] === 'development'
  ? (origin: string | undefined, cb: (e: Error | null, allow?: boolean) => void) => {
      if (!origin || origin.startsWith('http://localhost')) cb(null, true)
      else cb(new Error('Not allowed by CORS'))
    }
  : (process.env['CORS_ORIGIN'] ?? 'http://localhost:3000')

app.use(cors({ origin: corsOrigin }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/puzzles', puzzleRoutes)
app.use('/api/v1/games', gameRoutes)
app.use('/api/v1/redeem', redeemRoutes)
app.use('/api/v1/profile', profileRoutes)

app.use(errorHandler)

const PORT = parseInt(process.env['PORT'] ?? '4000', 10)

if (process.env['NODE_ENV'] !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

export default app
