import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, ChevronLeft, ShoppingBag } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLanguageStore } from '@/store/languageStore'
import { useCartStore } from '@/store/cartStore'

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, language, setLanguage } = useLanguageStore()
  const cartItems = useCartStore((state) => state.items)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const [scrolled, setScrolled] = useState(false)

  const isHome = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    if (path.startsWith('/product/')) return null
    return null
  }

  const pageTitle = getPageTitle()

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50
        h-16
        bg-cream/92 backdrop-blur-[20px]
        border-b border-stone/50
        flex items-center justify-between
        px-5
        transition-all duration-300
        ${scrolled ? 'shadow-soft' : ''}
      `}
    >
      {/* Left Side */}
      <div className="flex items-center gap-2">
        {!isHome && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="
              w-10 h-10 -ml-2
              flex items-center justify-center
              rounded-full
              hover:bg-sand
              transition-colors duration-300
            "
          >
            <ChevronLeft className="w-6 h-6 text-dark-gray" />
          </motion.button>
        )}

        {isHome ? (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span
              onClick={() => navigate('/')}
              className="
                font-display text-[22px] font-semibold
                text-forest tracking-[-0.01em]
                cursor-pointer select-none
              "
            >
              Decor<span className="text-sage font-normal">house</span>
            </span>
          </motion.div>
        ) : pageTitle ? (
          <h1 className="font-display text-lg font-medium text-charcoal">
            {pageTitle}
          </h1>
        ) : null}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Language Toggle */}
        <div className="flex bg-sand rounded-full p-[3px] gap-0.5">
          <button
            onClick={() => setLanguage('ru')}
            className={`
              px-3 py-1.5
              border-none rounded-full
              font-sans text-xs font-semibold
              uppercase tracking-[0.05em]
              cursor-pointer
              transition-all duration-300
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
              px-3 py-1.5
              border-none rounded-full
              font-sans text-xs font-semibold
              uppercase tracking-[0.05em]
              cursor-pointer
              transition-all duration-300
              ${language === 'uz'
                ? 'bg-forest text-white'
                : 'bg-transparent text-medium-gray hover:text-dark-gray'
              }
            `}
          >
            O'zb
          </button>
        </div>

        {/* Search */}
        {isHome && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/search')}
            className="
              w-10 h-10
              flex items-center justify-center
              rounded-full
              hover:bg-sand
              transition-colors duration-300
              text-dark-gray
            "
          >
            <Search className="w-[22px] h-[22px]" strokeWidth={1.5} />
          </motion.button>
        )}

        {/* Cart */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/cart')}
          className="
            w-10 h-10
            flex items-center justify-center
            rounded-full
            hover:bg-sand
            transition-colors duration-300
            text-dark-gray
            relative
          "
        >
          <ShoppingBag className="w-[22px] h-[22px]" strokeWidth={1.5} />
          {cartCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="
                absolute top-1 right-1
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
        </motion.button>
      </div>
    </header>
  )
}