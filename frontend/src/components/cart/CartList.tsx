import { AnimatePresence } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import { useLanguageStore } from '@/store/languageStore'
import { CartItem } from './CartItem'
import { EmptyState } from '../ui/EmptyState'

export function CartList() {
  const navigate = useNavigate()
  const { t } = useLanguageStore()
  const items = useCartStore((state) => state.items)

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title={t('cart.empty')}
        description={t('cart.emptyDesc')}
        action={{
          label: t('cart.continueShopping'),
          onClick: () => navigate('/catalog'),
        }}
      />
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <CartItem key={item.id} item={item} index={index} />
        ))}
      </AnimatePresence>
    </div>
  )
}