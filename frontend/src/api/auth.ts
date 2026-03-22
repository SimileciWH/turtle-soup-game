import { api } from './client'
import type { GuestResponse, ProfileResponse, RedeemResponse } from '../types/api'

export function createGuest() {
  return api.post<GuestResponse>('/auth/guest', {})
}

export function register(email: string, password: string, guestToken?: string) {
  return api.post<{ sent: boolean }>('/auth/register', {
    email,
    password,
    guest_token: guestToken
  })
}

export function verifyRegistration(email: string, code: string, guestToken?: string) {
  return api.post<{ token: string }>('/auth/register/verify', {
    email,
    code,
    guest_token: guestToken
  })
}

export function login(email: string, password: string) {
  return api.post<{ token: string }>('/auth/login', { email, password })
}

export function forgotPassword(email: string) {
  return api.post<{ message: string }>('/auth/password/forgot', { email })
}

export function resetPassword(email: string, code: string, newPassword: string) {
  return api.post<{ token: string }>('/auth/password/reset', {
    email,
    code,
    new_password: newPassword
  })
}

export function changePassword(currentPassword: string, newPassword: string) {
  return api.post<{ message: string }>('/auth/password/change', {
    current_password: currentPassword,
    new_password: newPassword
  })
}

export function sendDeleteOtp() {
  return api.post<{ sent: boolean }>('/auth/account/delete-otp', {})
}

export function deleteAccount(password: string, code?: string) {
  return api.delete<{ message: string }>('/auth/account', { password, code })
}

export function getProfile() {
  return api.get<ProfileResponse>('/profile')
}

export function redeemCode(code: string) {
  return api.post<RedeemResponse>('/redeem', { code })
}
