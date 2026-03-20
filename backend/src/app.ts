import 'dotenv/config'
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
app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000' }))
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
