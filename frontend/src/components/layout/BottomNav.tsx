import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Grid3X3, ShoppingBag, Heart, User } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { useCartStore } from '@/store/cartStore'
import { cn } from '@/utils/helpers'

const navItems = [
    { path: '/', icon: Home, labelKey: 'nav.home' },
    { path: '/catalog', icon: Grid3X3, labelKey: 'nav.catalog' },
    { path: '/cart', icon: ShoppingBag, labelKey: 'nav.cart', showBadge: true },
    { path: '/favorites', icon: Heart, labelKey: 'nav.favorites' },
    { path: '/profile', icon: User, labelKey: 'nav.profile' },
]

export function BottomNav() {
    const location = useLocation()
    const navigate = useNavigate()
    const { t } = useLanguageStore()
    const cartItems = useCartStore((state) => state.items)

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

    // Hide on checkout and order success
    const hiddenPaths = ['/checkout', '/order-success']
    if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
        return null
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
            <div className="safe-bottom">
                <div className="container max-w-lg mx-auto">
                    <div className="flex items-stretch h-16">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path !== '/' && location.pathname.startsWith(item.path))
                            const Icon = item.icon

                            return (
                                <motion.button
                                    key={item.path}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => navigate(item.path)}
                                    className="relative flex-1 flex flex-col items-center justify-center py-2"
                                >
                                    {/* Active Indicator - ИСПРАВЛЕНО: по центру, нормальный размер */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="bottomNavIndicator"
                                            className="absolute top-0 inset-x-0 mx-auto h-1 
                               bg-primary-500 rounded-b-full"
                                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                        />
                                    )}

                                    <div className="relative">
                                        <Icon
                                            className={cn(
                                                'w-6 h-6 transition-colors',
                                                isActive ? 'text-primary-500' : 'text-gray-400'
                                            )}
                                            fill={isActive && item.path === '/favorites' ? 'currentColor' : 'none'}
                                        />

                                        {/* Cart Badge */}
                                        {item.showBadge && cartCount > 0 && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-1 -right-2 min-w-[18px] h-[18px] 
                                 bg-primary-500 text-white text-[10px] font-bold 
                                 rounded-full flex items-center justify-center px-1"
                                            >
                                                {cartCount > 99 ? '99+' : cartCount}
                                            </motion.span>
                                        )}
                                    </div>

                                    <span
                                        className={cn(
                                            'text-[10px] mt-1 transition-colors',
                                            isActive ? 'text-primary-500 font-medium' : 'text-gray-400'
                                        )}
                                    >
                                        {t(item.labelKey)}
                                    </span>
                                </motion.button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </nav>
    )
}