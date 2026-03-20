import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { DifficultyFilter } from '../components/lobby/DifficultyFilter'
import { PuzzleCard } from '../components/lobby/PuzzleCard'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { listPuzzles } from '../api/puzzles'
import { startGame } from '../api/games'
import { createGuest, getProfile } from '../api/auth'
import type { Puzzle } from '../types/api'

export function Lobby() {
  const navigate = useNavigate()
  const { token, isGuest, setToken, setQuota } = useAuthStore()
  const { startGame: storeStartGame } = useGameStore()

  const [puzzles, setPuzzles] = useState<Puzzle[]>([])
  const [total, setTotal] = useState(0)
  const [difficulty, setDifficulty] = useState('all')
  const [loadingList, setLoadingList] = useState(false)
  const [startingId, setStartingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Initialize guest session on first visit
  useEffect(() => {
    if (!token) {
      initGuest()
    } else {
      fetchProfile()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchPuzzles()
  }, [difficulty]) // eslint-disable-line react-hooks/exhaustive-deps

  async function initGuest() {
    const existing = localStorage.getItem('hgt_guest_token')
    if (existing) {
      // Already have a guest token, just refresh quota from profile
      setToken(existing, true)
      return
    }
    try {
      const data = await createGuest()
      setToken(data.guest_token, true)
      setQuota(data.quota_free, data.quota_paid)
    } catch {
      // Guest creation failed silently; user can still browse
    }
  }

  async function fetchProfile() {
    try {
      const profile = await getProfile()
      setQuota(profile.quota_free, profile.quota_paid)
    } catch {
      // Token may be expired
    }
  }

  async function fetchPuzzles() {
    setLoadingList(true)
    setError(null)
    try {
      const res = await listPuzzles(difficulty)
      setPuzzles(res.puzzles)
      setTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoadingList(false)
    }
  }

  async function handleStart(puzzleId: number) {
    if (!token) {
      navigate('/auth')
      return
    }
    setStartingId(puzzleId)
    try {
      const res = await startGame(puzzleId)
      const puzzle = puzzles.find(p => p.id === puzzleId)!
      storeStartGame(Number(res.session_id), {
        id: res.puzzle_id,
        title: puzzle.title,
        surface: res.surface,
        difficulty: puzzle.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'
      })
      navigate(`/game/${res.session_id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '启动游戏失败')
    } finally {
      setStartingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-warm-white">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6">
        {isGuest && (
          <div className="mb-4 p-3 bg-sky/30 rounded-xl text-sm text-warm-brown text-center">
            当前以游客身份游玩，
            <button onClick={() => navigate('/auth')} className="text-ocean underline ml-1">
              登录后可保存进度并兑换局数
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-warm-brown text-xl">选择谜题</h2>
          <span className="text-sm text-warm-mid">共 {total} 题</span>
        </div>

        <DifficultyFilter value={difficulty} onChange={setDifficulty} />

        {error && (
          <div className="mt-4 p-3 bg-coral/10 text-coral rounded-xl text-sm">{error}</div>
        )}

        {loadingList ? (
          <div className="mt-8 text-center text-warm-mid">加载中…</div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {puzzles.map(puzzle => (
              <PuzzleCard
                key={puzzle.id}
                puzzle={puzzle}
                onStart={handleStart}
                loading={startingId === puzzle.id}
              />
            ))}
            {puzzles.length === 0 && !loadingList && (
              <div className="col-span-2 text-center text-warm-mid py-12">暂无谜题</div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
