import { API_URL } from '@/utils/constants'

const request = (path: string, init?: RequestInit) =>
  fetch(`${API_URL}/admin/auth${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })

export const adminAuthService = {
  async loginWithTelegram(initData: string) {
    const res = await request('/telegram', {
      method: 'POST',
      headers: { 'X-Telegram-Init-Data': initData },
      body: '{}',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) throw new Error(data.message || 'Нет доступа. Убедитесь что ваш ID в ADMIN_TELEGRAM_IDS')
  },
  async hasSession(): Promise<boolean> {
    try {
      const res = await request('/session')
      return res.ok
    } catch {
      return false
    }
  },
  async loginWithMagicToken(token: string) {
    const res = await request(`/magic?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) throw new Error(data.message || 'Ссылка недействительна')
  },
  async logout() {
    await request('/logout', { method: 'POST', body: '{}' }).catch(() => {})
  },
}
