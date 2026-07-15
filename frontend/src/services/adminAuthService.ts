import { API_URL } from '@/utils/constants'

async function request(path: string, init?: RequestInit) {
  return fetch(`${API_URL}/admin/auth${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
}

export const adminAuthService = {
  async login(password: string): Promise<void> {
    const response = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    })
    const data = await response.json()
    if (!response.ok || !data.success) throw new Error(data.message || 'Неверный пароль')
  },

  async hasSession(): Promise<boolean> {
    const response = await request('/session')
    return response.ok
  },

  async logout(): Promise<void> {
    await request('/logout', { method: 'POST', body: '{}' })
  },
}
