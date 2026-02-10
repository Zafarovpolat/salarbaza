import { motion } from 'framer-motion'
import { Check, Ruler } from 'lucide-react'
import { ProductVariant } from '@/types'
import { useLanguageStore } from '@/store/languageStore'
import { formatPrice } from '@/utils/formatPrice'
import { cn } from '@/utils/helpers'

interface SizeSelectorProps {
  variants: ProductVariant[]
  selectedId?: string
  onChange: (variant: ProductVariant) => void
}

export function SizeSelector({ variants, selectedId, onChange }: SizeSelectorProps) {
  const { language } = useLanguageStore()

  if (!variants || variants.length === 0) return null

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Ruler className="w-4 h-4 text-medium-gray" />
        <span className="font-semibold text-charcoal">
          {language === 'uz' ? "O'lchamni tanlang" : 'Выберите размер'}
        </span>
      </div>

      {/* Size Options */}
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = selectedId === variant.id
          const label = language === 'uz' ? variant.labelUz : variant.labelRu

          return (
            <motion.button
              key={variant.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(variant)}
              disabled={!variant.inStock}
              className={cn(
                'relative flex flex-col items-center',
                'px-4 py-3 rounded-2xl border-2',
                'transition-all duration-300 min-w-[90px]',
                isSelected
                  ? 'border-forest bg-forest/5 shadow-soft'
                  : 'border-stone hover:border-sage/50 bg-ivory',
                !variant.inStock && 'opacity-40 cursor-not-allowed bg-sand'
              )}
            >
              {/* Selected check */}
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-forest rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Size letter */}
              <span className={cn(
                'text-lg font-bold',
                isSelected ? 'text-forest' : 'text-charcoal'
              )}>
                {variant.size}
              </span>

              {/* Label */}
              <span className={cn(
                'text-xs mt-0.5',
                isSelected ? 'text-sage' : 'text-medium-gray'
              )}>
                {label}
              </span>

              {/* Price */}
              <span className={cn(
                'text-sm font-semibold mt-1',
                isSelected ? 'text-forest' : 'text-dark-gray'
              )}>
                {formatPrice(variant.price)}
              </span>

              {/* Out of stock */}
              {!variant.inStock && (
                <span className="text-[10px] text-error mt-1">
                  {language === 'uz' ? "Yo'q" : 'Нет'}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Dimensions info */}
      {selectedId && (() => {
        const selected = variants.find(v => v.id === selectedId)
        if (!selected?.dimensions) return null
        const dims = selected.dimensions as any

        return (
          <div className="bg-ivory rounded-xl px-4 py-2.5 text-xs text-medium-gray flex flex-wrap gap-x-4 gap-y-1 border border-stone/30">
            {dims.height_cm && (
              <span>{language === 'uz' ? 'Balandligi' : 'Высота'}: {dims.height_cm} {language === 'uz' ? 'sm' : 'см'}</span>
            )}
            {dims.diameter_cm && (
              <span>{language === 'uz' ? 'Diametri' : 'Диаметр'}: {dims.diameter_cm} {language === 'uz' ? 'sm' : 'см'}</span>
            )}
            {dims.width_cm && (
              <span>{language === 'uz' ? 'Kengligi' : 'Ширина'}: {dims.width_cm} {language === 'uz' ? 'sm' : 'см'}</span>
            )}
            {dims.volume_liters && (
              <span>{language === 'uz' ? 'Hajmi' : 'Объём'}: {dims.volume_liters} L</span>
            )}
          </div>
        )
      })()}
    </div>
  )
}