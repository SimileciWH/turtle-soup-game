const BASE_URL = '/api/v1'

function getToken(): string | null {
  return localStorage.getItem('hgt_token') ?? localStorage.getItem('hgt_guest_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const data = await res.json() as T

  if (!res.ok) {
    const err = data as { error: string; message: string }
    throw new Error(err.message ?? '请求失败')
  }

  return data
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) })
}
