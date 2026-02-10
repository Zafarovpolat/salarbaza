import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { ProductColor } from '@/types'
import { useLanguageStore } from '@/store/languageStore'
import { getColorName, cn } from '@/utils/helpers'

interface ColorSelectorProps {
  colors: ProductColor[]
  selectedId?: string
  onChange: (color: ProductColor) => void
}

export function ColorSelector({ colors, selectedId, onChange }: ColorSelectorProps) {
  const { language } = useLanguageStore()

  if (!colors || colors.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const isSelected = selectedId === color.id
          const colorName = getColorName(color, language)

          return (
            <motion.button
              key={color.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(color)}
              disabled={!color.inStock}
              className={cn(
                'relative flex items-center gap-2',
                'px-3.5 py-2.5 rounded-xl border-2',
                'transition-all duration-300',
                isSelected
                  ? 'border-forest bg-forest/5'
                  : 'border-stone hover:border-sage/50',
                !color.inStock && 'opacity-40 cursor-not-allowed'
              )}
            >
              {/* Color circle */}
              <div
                className="w-5 h-5 rounded-full border border-stone flex items-center justify-center"
                style={{ backgroundColor: color.hexCode || '#ccc' }}
              >
                {isSelected && (
                  <Check className={cn(
                    'w-3 h-3',
                    color.hexCode === '#FFFFFF' || color.hexCode === '#ffffff'
                      ? 'text-charcoal'
                      : 'text-white'
                  )} />
                )}
              </div>

              {/* Name */}
              <span className={cn(
                'text-sm',
                isSelected ? 'font-semibold text-forest' : 'text-dark-gray'
              )}>
                {colorName}
              </span>

              {/* Price modifier */}
              {color.priceModifier !== 0 && (
                <span className="text-xs text-medium-gray">
                  {color.priceModifier > 0 ? '+' : ''}{color.priceModifier.toLocaleString()}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}