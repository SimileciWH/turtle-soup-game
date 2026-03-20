import { create } from 'zustand'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface PuzzleSurface {
  id: number
  title: string
  surface: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface GameStore {
  sessionId: number | null
  puzzle: PuzzleSurface | null
  messages: Message[]
  questionCount: number
  questionLimit: number
  hintUsed: 0 | 1 | 2 | 3
  status: 'idle' | 'active' | 'won' | 'given_up'
  isStreaming: boolean

  startGame: (sessionId: number, puzzle: PuzzleSurface) => void
  addMessage: (msg: Message) => void
  appendToLastMessage: (delta: string) => void
  setStreaming: (v: boolean) => void
  setQuestionCount: (count: number) => void
  setHintUsed: (level: 0 | 1 | 2 | 3) => void
  setStatus: (status: GameStore['status']) => void
  resetGame: () => void
}

const initialState = {
  sessionId: null,
  puzzle: null,
  messages: [],
  questionCount: 0,
  questionLimit: 60,
  hintUsed: 0 as const,
  status: 'idle' as const,
  isStreaming: false
}

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  startGame: (sessionId, puzzle) =>
    set({ ...initialState, sessionId, puzzle, status: 'active' }),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  appendToLastMessage: (delta) =>
    set((s) => {
      const msgs = [...s.messages]
      if (msgs.length === 0) return {}
      msgs[msgs.length - 1] = {
        ...msgs[msgs.length - 1]!,
        content: msgs[msgs.length - 1]!.content + delta
      }
      return { messages: msgs }
    }),

  setStreaming: (isStreaming) => set({ isStreaming }),
  setQuestionCount: (questionCount) => set({ questionCount }),
  setHintUsed: (hintUsed) => set({ hintUsed }),
  setStatus: (status) => set({ status }),
  resetGame: () => set(initialState)
}))
