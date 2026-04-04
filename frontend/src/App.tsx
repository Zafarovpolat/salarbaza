import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import WebApp from '@twa-dev/sdk'
import { AppRouter } from './router'
import { API_URL } from '@/utils/constants'
import { useLanguageStore } from '@/store/languageStore'

function addPreconnect() {
  try {
    const apiOrigin = new URL(API_URL).origin
    if (!document.querySelector(`link[href="${apiOrigin}"]`)) {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = apiOrigin
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)

      const dns = document.createElement('link')
      dns.rel = 'dns-prefetch'
      dns.href = apiOrigin
      document.head.appendChild(dns)
    }
  } catch {}
}

function App() {
  const setLanguage = useLanguageStore((s) => s.setLanguage)

  useEffect(() => {
    addPreconnect()

    // ── Читаем ?lang= из URL (передаётся из бота) ────────────────────────
    const params = new URLSearchParams(window.location.search)
    const langParam = params.get('lang')
    if (langParam === 'uz' || langParam === 'ru') {
      setLanguage(langParam)
      // Убираем параметр из URL чтобы не мешал роутингу
      const url = new URL(window.location.href)
      url.searchParams.delete('lang')
      window.history.replaceState({}, '', url.toString())
    }

    // ── Также пробуем из Telegram startParam (если открыт через deep link) ─
    try {
      const tgStartParam = WebApp.initDataUnsafe?.start_param
      if (tgStartParam === 'lang_uz') setLanguage('uz')
      if (tgStartParam === 'lang_ru') setLanguage('ru')
    } catch {}

    try {
      WebApp.ready()
      WebApp.expand()
      WebApp.setHeaderColor('#22c55e')
      WebApp.setBackgroundColor('#f9fafb')
    } catch {}
  }, [])

  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </BrowserRouter>
  )
}

export default App