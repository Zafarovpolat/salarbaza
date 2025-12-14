// frontend/src/pages/ProfilePage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    User, Package, Globe, HelpCircle,
    MessageCircle, ChevronRight, Check
} from 'lucide-react'
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

    const displayName = user?.firstName || tgUser?.first_name ||
        (language === 'uz' ? 'Foydalanuvchi' : 'Пользователь')

    const menuItems = [
        {
            icon: Package,
            label: language === 'uz' ? 'Buyurtmalarim' : 'Мои заказы',
            onClick: () => navigate('/orders'),
        },
        {
            icon: Globe,
            label: language === 'uz' ? 'Til' : 'Язык',
            value: language === 'uz' ? "O'zbekcha" : 'Русский',
            onClick: () => setIsLanguageModalOpen(true),
        },
        {
            icon: HelpCircle,
            label: language === 'uz' ? 'Yordam' : 'Помощь',
            onClick: () => setIsHelpModalOpen(true),
        },
        {
            icon: MessageCircle,
            label: language === 'uz' ? 'Bog\'lanish' : 'Связаться',
            onClick: () => window.open('https://t.me/DekorHouseSupport', '_blank'),
        },
    ]

    return (
        <div className="pb-20">
            {/* Profile Header */}
            <section className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                <Container className="py-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">{displayName}</h1>
                            {tgUser?.username && (
                                <p className="text-primary-100">@{tgUser.username}</p>
                            )}
                        </div>
                    </div>
                </Container>
            </section>

            {/* Menu */}
            <section className="py-4">
                <Container>
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                        {menuItems.map((item, index) => {
                            const Icon = item.icon

                            return (
                                <motion.button
                                    key={index}
                                    whileTap={{ backgroundColor: '#f3f4f6' }}
                                    onClick={item.onClick}
                                    className={cn(
                                        'w-full flex items-center gap-4 px-4 py-4 text-left',
                                        index < menuItems.length - 1 && 'border-b border-gray-100'
                                    )}
                                >
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <span className="flex-1 font-medium text-gray-900">
                                        {item.label}
                                    </span>
                                    {item.value && (
                                        <span className="text-gray-400 text-sm">{item.value}</span>
                                    )}
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </motion.button>
                            )
                        })}
                    </div>
                </Container>
            </section>

            {/* App Info */}
            <section className="py-4">
                <Container>
                    <div className="text-center text-sm text-gray-400">
                        <p>DekorHouse v1.0.0</p>
                        <p className="mt-1">
                            {language === 'uz'
                                ? 'Uy va bog\' uchun dekoratsiyalar'
                                : 'Декор для дома и сада'}
                        </p>
                    </div>
                </Container>
            </section>

            {/* Language Modal */}
            <Modal
                isOpen={isLanguageModalOpen}
                onClose={() => setIsLanguageModalOpen(false)}
                title={language === 'uz' ? 'Tilni tanlang' : 'Выберите язык'}
            >
                <div className="p-4 space-y-2">
                    <button
                        onClick={() => {
                            setLanguage('uz')
                            setIsLanguageModalOpen(false)
                        }}
                        className={cn(
                            'w-full flex items-center gap-3 p-4 rounded-xl transition-colors',
                            language === 'uz'
                                ? 'bg-primary-50 border-2 border-primary-500'
                                : 'bg-gray-50 hover:bg-gray-100'
                        )}
                    >
                        <span className="text-2xl">🇺🇿</span>
                        <span className="flex-1 font-medium text-left">O'zbekcha</span>
                        {language === 'uz' && (
                            <Check className="w-5 h-5 text-primary-500" />
                        )}
                    </button>

                    <button
                        onClick={() => {
                            setLanguage('ru')
                            setIsLanguageModalOpen(false)
                        }}
                        className={cn(
                            'w-full flex items-center gap-3 p-4 rounded-xl transition-colors',
                            language === 'ru'
                                ? 'bg-primary-50 border-2 border-primary-500'
                                : 'bg-gray-50 hover:bg-gray-100'
                        )}
                    >
                        <span className="text-2xl">🇷🇺</span>
                        <span className="flex-1 font-medium text-left">Русский</span>
                        {language === 'ru' && (
                            <Check className="w-5 h-5 text-primary-500" />
                        )}
                    </button>
                </div>
            </Modal>

            {/* Help Modal */}
            <Modal
                isOpen={isHelpModalOpen}
                onClose={() => setIsHelpModalOpen(false)}
                title={language === 'uz' ? 'Yordam' : 'Помощь'}
            >
                <div className="p-4 space-y-4">
                    <div className="space-y-3">
                        <h3 className="font-medium text-gray-900">
                            {language === 'uz' ? 'Qanday buyurtma berish mumkin?' : 'Как сделать заказ?'}
                        </h3>
                        <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
                            <li>{language === 'uz' ? 'Katalogdan mahsulot tanlang' : 'Выберите товар из каталога'}</li>
                            <li>{language === 'uz' ? 'Savatga qo\'shing' : 'Добавьте в корзину'}</li>
                            <li>{language === 'uz' ? 'Savatga o\'ting' : 'Перейдите в корзину'}</li>
                            <li>{language === 'uz' ? 'Ma\'lumotlarni to\'ldiring' : 'Заполните данные'}</li>
                            <li>{language === 'uz' ? 'Buyurtmani tasdiqlang' : 'Подтвердите заказ'}</li>
                        </ol>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-medium text-gray-900">
                            {language === 'uz' ? 'Yetkazib berish' : 'Доставка'}
                        </h3>
                        <p className="text-gray-600 text-sm">
                            {language === 'uz'
                                ? 'Toshkent bo\'ylab 1-2 kun ichida yetkazib beramiz. 500 000 so\'mdan ortiq buyurtmalarga yetkazish bepul!'
                                : 'Доставка по Ташкенту 1-2 дня. Бесплатная доставка при заказе от 500 000 сум!'}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-medium text-gray-900">
                            {language === 'uz' ? 'Bog\'lanish' : 'Контакты'}
                        </h3>
                        <p className="text-gray-600 text-sm">
                            Telegram: @DekorHouseSupport<br />
                            {language === 'uz' ? 'Telefon' : 'Телефон'}: +998 90 123 45 67
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    )
}