import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { useCartStore } from '@/store/cartStore'

const navItems = [
  { path: '/',          icon: Home,        labelKey: 'nav.home' },
  { path: '/catalog',   icon: Search,      labelKey: 'nav.catalog' },
  { path: '/cart',       icon: ShoppingBag, labelKey: 'nav.cart', showBadge: true },
  { path: '/favorites', icon: Heart,       labelKey: 'nav.favorites' },
  { path: '/profile',   icon: User,        labelKey: 'nav.profile' },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguageStore()
  const cartItems = useCartStore((state) => state.items)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // Скрыть на определённых страницах
  const hiddenPaths = ['/checkout', '/order-success', '/admin']
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
    return null
  }

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-50
      bg-white
      h-[70px]
      shadow-nav
      rounded-t-3xl
    ">
      <div className="safe-bottom h-full">
        <div className="flex items-center justify-around h-full px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))
            const Icon = item.icon

            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(item.path)}
                className="
                  relative flex flex-col items-center
                  gap-1 py-2 px-3
                  border-none bg-transparent
                  cursor-pointer
                  transition-all duration-300
                "
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.span
                    layoutId="navIndicator"
                    className="absolute top-0 w-8 h-[3px] bg-forest rounded-full"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}

                {/* Icon */}
                <div className="relative">
                  <Icon
                    className={`
                      w-6 h-6 transition-all duration-300
                      ${isActive ? 'text-forest' : 'text-medium-gray'}
                    `}
                    strokeWidth={1.5}
                    fill={isActive && item.path === '/favorites' ? 'currentColor' : 'none'}
                  />

                  {/* Cart badge */}
                  {item.showBadge && cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="
                        absolute -top-1 -right-2
                        w-[18px] h-[18px]
                        bg-terracotta text-white
                        rounded-full
                        text-[10px] font-bold
                        flex items-center justify-center
                        leading-none
                      "
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </motion.span>
                  )}
                </div>

                {/* Label */}
                <span className={`
                  text-[10px] transition-colors duration-300
                  ${isActive
                    ? 'text-forest font-semibold'
                    : 'text-medium-gray font-medium'
                  }
                `}>
                  {t(item.labelKey)}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}