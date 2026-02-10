// frontend/src/components/product/SizeSelector.tsx

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

    const currency = language === 'uz' ? "so'm" : 'сум'

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">
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
                                'relative flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all min-w-[90px]',
                                isSelected
                                    ? 'border-primary-500 bg-primary-50 shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300 bg-white',
                                !variant.inStock && 'opacity-40 cursor-not-allowed bg-gray-50'
                            )}
                        >
                            {/* Selected Check */}
                            {isSelected && (
                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}

                            {/* Size Label (S, M, L) */}
                            <span className={cn(
                                'text-lg font-bold',
                                isSelected ? 'text-primary-700' : 'text-gray-900'
                            )}>
                                {variant.size}
                            </span>

                            {/* Size Name (Маленький, Средний...) */}
                            <span className={cn(
                                'text-xs mt-0.5',
                                isSelected ? 'text-primary-600' : 'text-gray-500'
                            )}>
                                {label}
                            </span>

                            {/* Price */}
                            <span className={cn(
                                'text-sm font-semibold mt-1',
                                isSelected ? 'text-primary-700' : 'text-gray-700'
                            )}>
                                {formatPrice(variant.price)}
                            </span>

                            {/* Out of stock label */}
                            {!variant.inStock && (
                                <span className="text-[10px] text-red-500 mt-1">
                                    {language === 'uz' ? "Yo'q" : 'Нет'}
                                </span>
                            )}
                        </motion.button>
                    )
                })}
            </div>

            {/* Dimensions info for selected variant */}
            {selectedId && (() => {
                const selected = variants.find(v => v.id === selectedId)
                if (!selected?.dimensions) return null
                const dims = selected.dimensions as any

                return (
                    <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                        {dims.height_cm && (
                            <span>
                                {language === 'uz' ? 'Balandligi' : 'Высота'}: {dims.height_cm} {language === 'uz' ? 'sm' : 'см'}
                            </span>
                        )}
                        {dims.diameter_cm && (
                            <span>
                                {language === 'uz' ? 'Diametri' : 'Диаметр'}: {dims.diameter_cm} {language === 'uz' ? 'sm' : 'см'}
                            </span>
                        )}
                        {dims.width_cm && (
                            <span>
                                {language === 'uz' ? 'Kengligi' : 'Ширина'}: {dims.width_cm} {language === 'uz' ? 'sm' : 'см'}
                            </span>
                        )}
                        {dims.volume_liters && (
                            <span>
                                {language === 'uz' ? 'Hajmi' : 'Объём'}: {dims.volume_liters} L
                            </span>
                        )}
                    </div>
                )
            })()}
        </div>
    )
}