import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Package, Globe, HelpCircle, MessageCircle, ChevronRight, Check } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'
import { useTelegram } from '@/hooks/useTelegram'
import { Container } from '@/components/layout/Container'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/utils/helpers'

export function ProfilePage() {
  const navigate = useNavigate()
  const { language, setLanguage } = useLanguageStore()
  const { user } = useUserStore()
  const { user: tgUser } = useTelegram()

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)

  const displayName = user?.firstName || tgUser?.first_name || (language === 'uz' ? 'Foydalanuvchi' : 'Пользователь')

  const menuItems = [
    { icon: Package, label: language === 'uz' ? 'Buyurtmalarim' : 'Мои заказы', onClick: () => navigate('/orders') },
    { icon: Globe, label: language === 'uz' ? 'Til' : 'Язык', value: language === 'uz' ? "O'zbekcha" : 'Русский', onClick: () => setIsLanguageModalOpen(true) },
    { icon: HelpCircle, label: language === 'uz' ? 'Yordam' : 'Помощь', onClick: () => setIsHelpModalOpen(true) },
    { icon: MessageCircle, label: language === 'uz' ? "Bog'lanish" : 'Связаться', onClick: () => window.open('https://t.me/DekorHouseSupport', '_blank') },
  ]

  return (
    <div className="pb-20">
      {/* Header */}
      <section className="bg-gradient-to-br from-forest via-emerald to-sage text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-[200px] h-[200px] rounded-full bg-white/5" />
        <Container className="py-8 relative z-[2]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <User className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-display text-xl font-medium">{displayName}</h1>
              {tgUser?.username && <p className="text-mint text-sm">@{tgUser.username}</p>}
            </div>
          </div>
        </Container>
      </section>

      {/* Menu */}
      <section className="py-4">
        <Container>
          <div className="bg-ivory rounded-3xl overflow-hidden border border-stone/30">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.button
                  key={index}
                  whileTap={{ scale: 0.99 }}
                  onClick={item.onClick}
                  className={cn(
                    'w-full flex items-center gap-4 px-5 py-4 text-left transition-colors duration-300 hover:bg-sand/50',
                    index < menuItems.length - 1 && 'border-b border-stone/20'
                  )}
                >
                  <div className="w-10 h-10 bg-sand rounded-2xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-dark-gray" strokeWidth={1.5} />
                  </div>
                  <span className="flex-1 font-medium text-charcoal">{item.label}</span>
                  {item.value && <span className="text-taupe text-sm">{item.value}</span>}
                  <ChevronRight className="w-5 h-5 text-taupe" />
                </motion.button>
              )
            })}
          </div>
        </Container>
      </section>

      {/* App Info */}
      <section className="py-4">
        <Container>
          <div className="text-center">
            <span className="font-display text-lg text-forest font-semibold">
              Decor<span className="text-sage font-normal">house</span>
            </span>
            <p className="text-xs text-taupe mt-1">v1.0.0</p>
          </div>
        </Container>
      </section>

      {/* Language Modal */}
      <Modal isOpen={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} title={language === 'uz' ? 'Tilni tanlang' : 'Выберите язык'}>
        <div className="p-5 space-y-2">
          {[
            { code: 'uz' as const, label: "O'zbekcha", flag: '🇺🇿' },
            { code: 'ru' as const, label: 'Русский', flag: '🇷🇺' },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => { setLanguage(lang.code); setIsLanguageModalOpen(false) }}
              className={cn(
                'w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300',
                language === lang.code
                  ? 'bg-forest/5 border-2 border-forest'
                  : 'bg-ivory border-2 border-transparent hover:bg-sand'
              )}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="flex-1 font-medium text-left text-charcoal">{lang.label}</span>
              {language === lang.code && <Check className="w-5 h-5 text-forest" />}
            </button>
          ))}
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} title={language === 'uz' ? 'Yordam' : 'Помощь'}>
        <div className="p-5 space-y-5">
          <div>
            <h3 className="font-display text-base font-medium text-charcoal mb-2">
              {language === 'uz' ? 'Qanday buyurtma berish mumkin?' : 'Как сделать заказ?'}
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-dark-gray text-sm">
              <li>{language === 'uz' ? 'Katalogdan mahsulot tanlang' : 'Выберите товар из каталога'}</li>
              <li>{language === 'uz' ? "Savatga qo'shing" : 'Добавьте в корзину'}</li>
              <li>{language === 'uz' ? "Savatga o'ting" : 'Перейдите в корзину'}</li>
              <li>{language === 'uz' ? "Ma'lumotlarni to'ldiring" : 'Заполните данные'}</li>
              <li>{language === 'uz' ? 'Buyurtmani tasdiqlang' : 'Подтвердите заказ'}</li>
            </ol>
          </div>
          <div>
            <h3 className="font-display text-base font-medium text-charcoal mb-2">
              {language === 'uz' ? 'Yetkazib berish' : 'Доставка'}
            </h3>
            <p className="text-dark-gray text-sm leading-relaxed">
              {language === 'uz'
                ? "Toshkent bo'ylab 1-2 kun ichida. 500 000 so'mdan ortiq buyurtmalarga bepul!"
                : 'По Ташкенту 1-2 дня. Бесплатная доставка от 500 000 сум!'}
            </p>
          </div>
          <div>
            <h3 className="font-display text-base font-medium text-charcoal mb-2">
              {language === 'uz' ? "Bog'lanish" : 'Контакты'}
            </h3>
            <p className="text-dark-gray text-sm">
              Telegram: @DekorHouseSupport<br />
              {language === 'uz' ? 'Telefon' : 'Телефон'}: +998 90 123 45 67
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}