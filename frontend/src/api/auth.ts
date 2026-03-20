import { api } from './client'
import type { GuestResponse, ProfileResponse, RedeemResponse } from '../types/api'

export function createGuest() {
  return api.post<GuestResponse>('/auth/guest', {})
}

export function sendEmailCode(email: string) {
  return api.post<{ message: string }>('/auth/email/send', { email })
}

export function verifyEmailCode(email: string, code: string, guestToken?: string) {
  return api.post<{ token: string }>('/auth/email/verify', { email, code, guest_token: guestToken })
}

export function getProfile() {
  return api.get<ProfileResponse>('/profile')
}

export function redeemCode(code: string) {
  return api.post<RedeemResponse>('/redeem', { code })
}
