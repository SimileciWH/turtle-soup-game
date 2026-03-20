const KEY = 'hgt_guest_token'

export function getOrCreateGuestToken(): string {
  let token = localStorage.getItem(KEY)
  if (!token) {
    token = 'g_' + crypto.randomUUID().replace(/-/g, '')
    localStorage.setItem(KEY, token)
  }
  return token
}

export function clearGuestToken(): void {
  localStorage.removeItem(KEY)
}
