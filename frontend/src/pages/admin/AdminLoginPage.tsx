import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { adminAuthService } from '@/services/adminAuthService'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Проверка доступа…')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const has = await adminAuthService.hasSession().catch(() => false)
        if (cancelled) return
        if (has) {
          navigate('/admin/dashboard', { replace: true })
          return
        }
      } catch {
        // ignore, will try telegram login
      }

      if (cancelled) return

      if (!WebApp.initData) {
        setMessage('Откройте команду /admin в Telegram-боте @DecorMarketUz_Bot и нажмите кнопку. Для ПК — после /admin бот пришлет ссылку для браузера.')
        return
      }

      try {
        await adminAuthService.loginWithTelegram(WebApp.initData)
        if (!cancelled) navigate('/admin/dashboard', { replace: true })
      } catch (e) {
        if (!cancelled) setMessage(e instanceof Error ? e.message : 'Нет доступа')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-6">
      <div className="bg-white p-8 rounded-2xl text-center max-w-sm shadow-sm">
        <h1 className="text-2xl font-bold text-forest">Админ-панель Dekor Market</h1>
        <p className="mt-3 text-gray-500 text-sm">{message}</p>
        <p className="mt-4 text-xs text-gray-400">Если зависает — очистите кэш Телеграма и откройте через бота заново.</p>
      </div>
    </div>
  )
}
