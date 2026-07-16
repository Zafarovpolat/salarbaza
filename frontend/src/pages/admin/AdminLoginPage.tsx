import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { adminAuthService } from '@/services/adminAuthService'
import { LoadingScreen } from '@/components/common/LoadingScreen'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [message, setMessage] = useState<string | null>(null)

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
      } catch {}

      if (cancelled) return

      if (!WebApp.initData) {
        setMessage(
          'Откройте команду /admin в Telegram-боте @DecorMarketUz_Bot и нажмите кнопку. Для работы с ПК — после /admin бот пришлёт одноразовую ссылку для браузера (действует 15 мин).'
        )
        return
      }

      try {
        await adminAuthService.loginWithTelegram(WebApp.initData)
        if (!cancelled) navigate('/admin/dashboard', { replace: true })
      } catch (e) {
        if (!cancelled) setMessage(e instanceof Error ? e.message : 'Нет доступа. Убедитесь что ваш ID в списке админов.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate])

  if (!message) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-6">
      <div className="bg-white p-8 rounded-2xl text-center max-w-sm shadow-sm">
        <h1 className="text-2xl font-bold text-forest">
          Dekor<span className="text-sage font-normal"> Market</span>
          <span className="block text-sm font-normal text-gray-500 mt-1">Админ-панель</span>
        </h1>
        <p className="mt-4 text-sm text-gray-600">{message}</p>
        <p className="mt-4 text-xs text-gray-400">Если зависает — очистите кэш Телеги: Настройки → Данные и память → Очистить кэш</p>
      </div>
    </div>
  )
}
