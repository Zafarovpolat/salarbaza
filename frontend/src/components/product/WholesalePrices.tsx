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
  onQuantityChange,
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
      if (data.success) setTiers(data.data.wholesalePrices)
    } catch (error) {
      console.error('Failed to load wholesale prices:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || tiers.length === 0) return null

  const fmtPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price)

  const currentTier = [...tiers].reverse().find(tier => currentQuantity >= tier.minQuantity)
  const nextTier = tiers.find(tier => tier.minQuantity > currentQuantity)

  return (
    <div className="
      bg-gradient-to-br from-forest/5 to-sage/10
      rounded-3xl p-5
      border border-sage/20
    ">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="
          w-10 h-10
          bg-gradient-to-br from-forest to-sage
          rounded-xl
          flex items-center justify-center
        ">
          <Package className="w-5 h-5 text-white" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="font-display text-base font-medium text-charcoal">
            {language === 'uz' ? 'Ulgurji narxlar' : 'Оптовые цены'}
          </h3>
          <p className="text-xs text-medium-gray">
            {language === 'uz' ? "Ko'proq olsangiz, arzonroq" : 'Больше берёте — дешевле'}
          </p>
        </div>
      </div>

      {/* Tiers */}
      <div className="space-y-2">
        {tiers.map((tier) => {
          const isActive = currentTier?.minQuantity === tier.minQuantity
          const isPassed = currentQuantity >= tier.minQuantity

          return (
            <button
              key={tier.minQuantity}
              onClick={() => onQuantityChange?.(tier.minQuantity)}
              className={cn(
                'w-full flex items-center justify-between',
                'p-3.5 rounded-2xl transition-all duration-300',
                isActive
                  ? 'bg-forest text-white shadow-button-green'
                  : isPassed
                    ? 'bg-sage/15 text-forest'
                    : 'bg-ivory text-dark-gray hover:bg-sand border border-stone/30'
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-sm font-medium',
                  isActive ? 'text-white' : 'text-charcoal'
                )}>
                  {tier.minQuantity}+ {language === 'uz' ? 'dona' : 'шт'}
                </span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[11px] font-bold',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-terracotta/15 text-terracotta'
                )}>
                  -{tier.discountPercent}%
                </span>
              </div>
              <span className={cn(
                'font-bold text-sm',
                isActive ? 'text-white' : 'text-forest'
              )}>
                {fmtPrice(tier.pricePerUnit)} {language === 'uz' ? "so'm" : 'сум'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Next tier hint */}
      {nextTier && (
        <div className="
          mt-4 flex items-center gap-2
          text-sm text-forest
          bg-sage/10 rounded-xl p-3
          border border-sage/20
        ">
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
          <p className="text-sm text-medium-gray">
            {language === 'uz' ? 'Tejamkorligingiz:' : 'Ваша экономия:'}{' '}
            <span className="font-bold text-forest">
              {fmtPrice((basePrice - currentTier.pricePerUnit) * currentQuantity)}{' '}
              {language === 'uz' ? "so'm" : 'сум'}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}