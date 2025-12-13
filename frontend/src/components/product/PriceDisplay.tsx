import { useLanguageStore } from '@/store/languageStore'
import { formatPrice } from '@/utils/formatPrice'
import { cn } from '@/utils/helpers'

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
        md: { price: 'text-xl', old: 'text-sm', currency: 'text-sm' },
        lg: { price: 'text-2xl', old: 'text-base', currency: 'text-base' },
    }

    const hasDiscount = oldPrice && oldPrice > price
    const discountPercent = hasDiscount
        ? Math.round((1 - price / oldPrice) * 100)
        : 0

    return (
        <div className="flex items-baseline gap-2 flex-wrap">
            <span className={cn('font-bold text-gray-900', sizes[size].price)}>
                {formatPrice(price)}
                {showCurrency && (
                    <span className={cn('font-normal text-gray-500 ml-1', sizes[size].currency)}>
                        {currency}
                    </span>
                )}
            </span>

            {hasDiscount && (
                <>
                    <span className={cn('text-gray-400 line-through', sizes[size].old)}>
                        {formatPrice(oldPrice)}
                    </span>
                    <span className={cn(
                        'px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-medium',
                        sizes[size].old
                    )}>
                        -{discountPercent}%
                    </span>
                </>
            )}
        </div>
    )
}