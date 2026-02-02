import { useEffect, useState } from 'react'
import { Package, TrendingDown } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { cn } from '@/utils/helpers'

interface WholesaleTier {
    minQuantity: number
    discountPercent: number
    pricePerUnit: number
}

interface WholesalePricesProps {
    productId: string
    basePrice: number
    currentQuantity: number
    onQuantityChange?: (quantity: number) => void
}

const API_URL = import.meta.env.VITE_API_URL

export function WholesalePrices({
    productId,
    basePrice,
    currentQuantity,
    onQuantityChange
}: WholesalePricesProps) {
    const { language } = useLanguageStore()
    const [tiers, setTiers] = useState<WholesaleTier[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadWholesalePrices()
    }, [productId])

    const loadWholesalePrices = async () => {
        try {
            const res = await fetch(`${API_URL}/wholesale/product/${productId}`)
            const data = await res.json()
            if (data.success) {
                setTiers(data.data.wholesalePrices)
            }
        } catch (error) {
            console.error('Failed to load wholesale prices:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading || tiers.length === 0) return null

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ru-RU').format(price)
    }

    const currentTier = [...tiers]
        .reverse()
        .find(tier => currentQuantity >= tier.minQuantity)

    const nextTier = tiers.find(tier => tier.minQuantity > currentQuantity)

    return (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">
                        {language === 'uz' ? 'Ulgurji narxlar' : 'Оптовые цены'}
                    </h3>
                    <p className="text-xs text-gray-500">
                        {language === 'uz' ? 'Ko\'proq olsangiz, arzonroq' : 'Больше берёте — дешевле'}
                    </p>
                </div>
            </div>

            {/* Price Tiers */}
            <div className="space-y-2">
                {tiers.map((tier) => {
                    const isActive = currentTier?.minQuantity === tier.minQuantity
                    const isPassed = currentQuantity >= tier.minQuantity

                    return (
                        <button
                            key={tier.minQuantity}
                            onClick={() => onQuantityChange?.(tier.minQuantity)}
                            className={cn(
                                'w-full flex items-center justify-between p-3 rounded-xl transition-all',
                                isActive
                                    ? 'bg-green-500 text-white shadow-md'
                                    : isPassed
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    'text-sm font-medium',
                                    isActive ? 'text-white' : 'text-gray-900'
                                )}>
                                    {tier.minQuantity}+ {language === 'uz' ? 'dona' : 'шт'}
                                </span>
                                <span className={cn(
                                    'px-2 py-0.5 rounded-full text-xs font-bold',
                                    isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-red-100 text-red-600'
                                )}>
                                    -{tier.discountPercent}%
                                </span>
                            </div>
                            <span className={cn(
                                'font-bold',
                                isActive ? 'text-white' : 'text-green-600'
                            )}>
                                {formatPrice(tier.pricePerUnit)} {language === 'uz' ? 'soʻm' : 'сўм'}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Next tier hint */}
            {nextTier && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-100 rounded-lg p-2">
                    <TrendingDown className="w-4 h-4 flex-shrink-0" />
                    <span>
                        {language === 'uz'
                            ? `Yana ${nextTier.minQuantity - currentQuantity} ta qo'shing va ${nextTier.discountPercent}% tejang!`
                            : `Добавьте ещё ${nextTier.minQuantity - currentQuantity} шт и сэкономьте ${nextTier.discountPercent}%!`
                        }
                    </span>
                </div>
            )}

            {/* Current savings */}
            {currentTier && (
                <div className="mt-3 text-center">
                    <p className="text-sm text-gray-600">
                        {language === 'uz' ? 'Sizning tejamkorligingiz:' : 'Ваша экономия:'}{' '}
                        <span className="font-bold text-green-600">
                            {formatPrice((basePrice - currentTier.pricePerUnit) * currentQuantity)} {language === 'uz' ? 'soʻm' : 'сўм'}
                        </span>
                    </p>
                </div>
            )}
        </div>
    )
}