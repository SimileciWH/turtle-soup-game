jest.mock('../utils/prisma', () => ({
  prisma: {
    puzzle: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn()
    }
  }
}))

import { prisma } from '../utils/prisma'
import * as puzzleService from '../services/puzzleService'

const mockPuzzle = prisma.puzzle as jest.Mocked<typeof prisma.puzzle>

const safePuzzle = {
  id: 1, title: '测试谜题', summary: '摘要', surface: '汤面',
  difficulty: 'EASY' as const, tags: null, isDaily: false,
  playCount: 0, createdAt: new Date()
}

describe('puzzleService', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('listPuzzles', () => {
    it('returns puzzles and total', async () => {
      mockPuzzle.findMany.mockResolvedValue([safePuzzle] as never)
      mockPuzzle.count.mockResolvedValue(1)

      const result = await puzzleService.listPuzzles('all', 1, 20)

      expect(result.puzzles).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('filters by difficulty', async () => {
      mockPuzzle.findMany.mockResolvedValue([] as never)
      mockPuzzle.count.mockResolvedValue(0)

      await puzzleService.listPuzzles('easy', 1, 20)

      expect(mockPuzzle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ difficulty: 'EASY' })
        })
      )
    })

    it('never returns answer or facts fields', async () => {
      mockPuzzle.findMany.mockResolvedValue([safePuzzle] as never)
      mockPuzzle.count.mockResolvedValue(1)

      await puzzleService.listPuzzles('all', 1, 20)

      const selectArg = (mockPuzzle.findMany.mock.calls[0]![0] as { select: Record<string, boolean> }).select
      expect(selectArg['answer']).toBeUndefined()
      expect(selectArg['facts']).toBeUndefined()
      expect(selectArg['hint1']).toBeUndefined()
    })
  })

  describe('getPuzzleById', () => {
    it('returns puzzle when found', async () => {
      mockPuzzle.findUnique.mockResolvedValue(safePuzzle as never)
      const result = await puzzleService.getPuzzleById(1)
      expect(result.id).toBe(1)
    })

    it('throws NOT_FOUND when missing', async () => {
      mockPuzzle.findUnique.mockResolvedValue(null)
      await expect(puzzleService.getPuzzleById(999))
        .rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it('never returns answer in safe query', async () => {
      mockPuzzle.findUnique.mockResolvedValue(safePuzzle as never)
      await puzzleService.getPuzzleById(1)

      const selectArg = (mockPuzzle.findUnique.mock.calls[0]![0] as { select: Record<string, boolean> }).select
      expect(selectArg['answer']).toBeUndefined()
    })
  })

  describe('getFullPuzzle', () => {
    it('includes answer and facts for internal use', async () => {
      mockPuzzle.findUnique.mockResolvedValue({ ...safePuzzle, answer: '真相', facts: [] } as never)
      const result = await puzzleService.getFullPuzzle(1)
      expect(result.answer).toBe('真相')
    })
  })
})
