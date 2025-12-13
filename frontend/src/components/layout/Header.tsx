import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, ChevronLeft } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { LanguageSwitcher } from '../common/LanguageSwitcher'

export function Header() {
    const navigate = useNavigate()
    const location = useLocation()
    const { t } = useLanguageStore()

    const isHome = location.pathname === '/'

    const getPageTitle = () => {
        const path = location.pathname
        if (path === '/') return null
        if (path === '/catalog') return t('nav.catalog')
        if (path === '/cart') return t('nav.cart')
        if (path === '/favorites') return t('nav.favorites')
        if (path === '/profile') return t('nav.profile')
        if (path === '/orders') return t('orders.title')
        if (path === '/checkout') return t('checkout.title')
        if (path === '/search') return t('common.search')
        if (path.startsWith('/catalog/')) return t('nav.catalog')
        if (path.startsWith('/product/')) return null // Will show product name
        return null
    }

    const pageTitle = getPageTitle()

    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
            <div className="container h-14 flex items-center justify-between gap-4">
                {/* Left Side */}
                <div className="flex items-center gap-2">
                    {!isHome && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-700" />
                        </motion.button>
                    )}

                    {isHome ? (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2"
                        >
                            <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-lg">D</span>
                            </div>
                            <span className="font-display font-bold text-xl text-gray-900">
                                DekorHouse
                            </span>
                        </motion.div>
                    ) : pageTitle ? (
                        <h1 className="font-semibold text-lg text-gray-900">
                            {pageTitle}
                        </h1>
                    ) : null}
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-2">
                    {isHome && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate('/search')}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <Search className="w-5 h-5 text-gray-600" />
                        </motion.button>
                    )}

                    <LanguageSwitcher />
                </div>
            </div>
        </header>
    )
}