import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function AdminMagicPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('Проверяем ссылку…')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('Токен не найден. Откройте /admin в боте заново.')
      return
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

    fetch(`${API_URL}/admin/auth/magic?token=${encodeURIComponent(token)}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.success) {
          setStatus('Успешно! Переходим в админку…')
          setTimeout(() => navigate('/admin/dashboard', { replace: true }), 500)
        } else {
          setStatus(data.message || 'Ссылка недействительна или просрочена. Снова /admin в боте.')
        }
      })
      .catch(() => {
        setStatus('Ошибка сети. Попробуйте еще раз через бота /admin')
      })
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-6">
      <div className="bg-white p-8 rounded-2xl text-center max-w-sm shadow-sm">
        <h1 className="text-xl font-bold text-forest">Dekor Market — Magic Link</h1>
        <p className="mt-3 text-sm text-gray-600">{status}</p>
        <p className="mt-4 text-xs text-gray-400">Ссылка одноразовая, действует 15 мин. Не пересылайте.</p>
      </div>
    </div>
  )
}
