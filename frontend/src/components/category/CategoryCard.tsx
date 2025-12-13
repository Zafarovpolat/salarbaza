import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Category } from '@/types'
import { useLanguageStore } from '@/store/languageStore'
import { getCategoryName } from '@/utils/helpers'

interface CategoryCardProps {
    category: Category
    index?: number
    variant?: 'circle' | 'card'
}

export const CategoryCard = memo(function CategoryCard({
    category,
    index = 0,
    variant = 'circle',
}: CategoryCardProps) {
    const navigate = useNavigate()
    const { language } = useLanguageStore()

    const name = getCategoryName(category, language)

    if (variant === 'circle') {
        return (
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/catalog/${category.slug}`)}
                className="flex flex-col items-center gap-2 min-w-[72px]"
            >
                <div className="w-[72px] h-[72px] bg-gray-100 rounded-full flex items-center 
                      justify-center overflow-hidden hover:bg-gray-200 transition-colors">
                    {category.image ? (
                        <img
                            src={category.image}
                            alt={name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-3xl">{category.icon || '📦'}</span>
                    )}
                </div>
                <span className="text-xs text-gray-700 font-medium text-center line-clamp-2">
                    {name}
                </span>
            </motion.button>
        )
    }

    // Card variant
    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/catalog/${category.slug}`)}
            className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 
                 shadow-sm hover:shadow-md transition-all group"
        >
            {/* Image */}
            <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                {category.image ? (
                    <img
                        src={category.image}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl">{category.icon || '📦'}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3">
                <h3 className="font-semibold text-gray-900">{name}</h3>
                {category.productCount !== undefined && (
                    <p className="text-sm text-gray-500">
                        {category.productCount} {language === 'uz' ? 'ta mahsulot' : 'товаров'}
                    </p>
                )}
            </div>
        </motion.button>
    )
})