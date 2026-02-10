import { useLanguageStore } from '@/store/languageStore'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore()

  return (
    <div className="flex bg-sand rounded-full p-[3px] gap-0.5">
      <button
        onClick={() => setLanguage('ru')}
        className={`
          px-3 py-1.5 border-none rounded-full
          font-sans text-xs font-semibold
          uppercase tracking-[0.05em]
          cursor-pointer transition-all duration-300
          ${language === 'ru'
            ? 'bg-forest text-white'
            : 'bg-transparent text-medium-gray hover:text-dark-gray'
          }
        `}
      >
        Рус
      </button>
      <button
        onClick={() => setLanguage('uz')}
        className={`
          px-3 py-1.5 border-none rounded-full
          font-sans text-xs font-semibold
          uppercase tracking-[0.05em]
          cursor-pointer transition-all duration-300
          ${language === 'uz'
            ? 'bg-forest text-white'
            : 'bg-transparent text-medium-gray hover:text-dark-gray'
          }
        `}
      >
        O'zb
      </button>
    </div>
  )
}