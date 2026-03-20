import { create } from 'zustand'

interface AuthState {
  token: string | null
  isGuest: boolean
  quotaFree: number
  quotaPaid: number
  setToken: (token: string, isGuest: boolean) => void
  setQuota: (free: number, paid: number) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('hgt_token') ?? localStorage.getItem('hgt_guest_token'),
  isGuest: !localStorage.getItem('hgt_token'),
  quotaFree: 0,
  quotaPaid: 0,

  setToken: (token, isGuest) => {
    const key = isGuest ? 'hgt_guest_token' : 'hgt_token'
    localStorage.setItem(key, token)
    set({ token, isGuest })
  },

  setQuota: (quotaFree, quotaPaid) => set({ quotaFree, quotaPaid }),

  logout: () => {
    localStorage.removeItem('hgt_token')
    set({ token: null, isGuest: true, quotaFree: 0, quotaPaid: 0 })
  }
}))
