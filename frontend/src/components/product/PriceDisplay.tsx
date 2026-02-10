import { useLanguageStore } from '@/store/languageStore'
import { formatPrice } from '@/utils/formatPrice'
import { cn } from '@/utils/helpers'
import { Badge } from '../ui/Badge'

interface PriceDisplayProps {
  price: number
  oldPrice?: number
  size?: 'sm' | 'md' | 'lg'
  showCurrency?: boolean
}

export function PriceDisplay({
  price,
  oldPrice,
  size = 'md',
  showCurrency = true,
}: PriceDisplayProps) {
  const { language } = useLanguageStore()
  const currency = language === 'uz' ? "so'm" : 'сум'

  const sizes = {
    sm: { price: 'text-base', old: 'text-xs', currency: 'text-xs' },
    md: { price: 'text-xl',  old: 'text-sm', currency: 'text-sm' },
    lg: { price: 'text-2xl', old: 'text-base', currency: 'text-base' },
  }

  const hasDiscount = oldPrice && oldPrice > price
  const discountPercent = hasDiscount
    ? Math.round((1 - price / oldPrice) * 100)
    : 0

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className={cn('font-bold text-forest', sizes[size].price)}>
        {formatPrice(price)}
        {showCurrency && (
          <span className={cn('font-normal text-medium-gray ml-1', sizes[size].currency)}>
            {currency}
          </span>
        )}
      </span>

      {hasDiscount && (
        <>
          <span className={cn('text-light-gray line-through', sizes[size].old)}>
            {formatPrice(oldPrice)}
          </span>
          <Badge variant="sale" size="sm">
            -{discountPercent}%
          </Badge>
        </>
      )}
    </div>
  )
}