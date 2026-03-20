jest.mock('../utils/prisma', () => ({
  prisma: {
    puzzle: {
      findUnique: jest.fn()
    },
    gameSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    gameMessage: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn()
    }
  }
}))

import { prisma } from '../utils/prisma'
import * as gameService from '../services/gameService'

const mockSession = prisma.gameSession as jest.Mocked<typeof prisma.gameSession>
const mockMessage = prisma.gameMessage as jest.Mocked<typeof prisma.gameMessage>
const mockPuzzle = prisma.puzzle as jest.Mocked<typeof prisma.puzzle>

const baseSession = {
  id: BigInt(1),
  userId: BigInt(10),
  puzzleId: 1,
  status: 'ACTIVE' as const,
  questionCount: 0,
  hintUsed: 0,
  startedAt: new Date(),
  endedAt: null,
  durationSec: null
}

describe('gameService', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('createSession', () => {
    it('creates session when puzzle is active', async () => {
      mockPuzzle.findUnique.mockResolvedValue({ id: 1 } as never)
      mockSession.create.mockResolvedValue(baseSession as never)

      const result = await gameService.createSession(BigInt(10), 1)

      expect(result.puzzleId).toBe(1)
      expect(mockSession.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ puzzleId: 1 }) })
      )
    })

    it('throws NOT_FOUND when puzzle does not exist', async () => {
      mockPuzzle.findUnique.mockResolvedValue(null)

      await expect(gameService.createSession(BigInt(10), 999))
        .rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
  })

  describe('getSessionById', () => {
    it('returns session when user matches', async () => {
      mockSession.findUnique.mockResolvedValue(baseSession as never)

      const result = await gameService.getSessionById(BigInt(1), BigInt(10))
      expect(result.id).toBe(BigInt(1))
    })

    it('throws NOT_FOUND when session belongs to different user', async () => {
      mockSession.findUnique.mockResolvedValue({ ...baseSession, userId: BigInt(99) } as never)

      await expect(gameService.getSessionById(BigInt(1), BigInt(10)))
        .rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it('throws NOT_FOUND when session does not exist', async () => {
      mockSession.findUnique.mockResolvedValue(null)

      await expect(gameService.getSessionById(BigInt(1), BigInt(10)))
        .rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
  })

  describe('isAtQuestionLimit', () => {
    it('returns false when below limit', () => {
      expect(gameService.isAtQuestionLimit({ ...baseSession, questionCount: 59 })).toBe(false)
    })

    it('returns true when at limit', () => {
      expect(gameService.isAtQuestionLimit({ ...baseSession, questionCount: 60 })).toBe(true)
    })
  })

  describe('addMessage', () => {
    it('adds message with correct seq', async () => {
      mockMessage.count.mockResolvedValue(3)
      mockMessage.create.mockResolvedValue({} as never)

      await gameService.addMessage(BigInt(1), 'USER', 'hello')

      expect(mockMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ seq: 4, content: 'hello' })
        })
      )
    })
  })

  describe('incrementQuestionCount', () => {
    it('increments and returns new count', async () => {
      mockSession.update.mockResolvedValue({ ...baseSession, questionCount: 1 } as never)

      const result = await gameService.incrementQuestionCount(BigInt(1))
      expect(result).toBe(1)
    })
  })

  describe('getHint', () => {
    it('returns hint and increments hint_used', async () => {
      mockSession.findUnique.mockResolvedValue(baseSession as never)
      mockPuzzle.findUnique.mockResolvedValue({
        hint1: '提示1', hint2: '提示2', hint3: '提示3'
      } as never)
      mockSession.update.mockResolvedValue({} as never)

      const hint = await gameService.getHint(BigInt(1), BigInt(10))
      expect(hint).toBe('提示1')
    })

    it('throws HINT_EXHAUSTED when all hints used', async () => {
      mockSession.findUnique.mockResolvedValue({ ...baseSession, hintUsed: 3 } as never)

      await expect(gameService.getHint(BigInt(1), BigInt(10)))
        .rejects.toMatchObject({ code: 'HINT_EXHAUSTED' })
    })

    it('throws SESSION_NOT_ACTIVE when session is not active', async () => {
      mockSession.findUnique.mockResolvedValue({
        ...baseSession, status: 'WON'
      } as never)

      await expect(gameService.getHint(BigInt(1), BigInt(10)))
        .rejects.toMatchObject({ code: 'SESSION_NOT_ACTIVE' })
    })
  })
})
