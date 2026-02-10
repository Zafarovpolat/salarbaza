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

  // ===== CIRCLE VARIANT (горизонтальный скролл на главной) =====
  if (variant === 'circle') {
    return (
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => navigate(`/catalog/${category.slug}`)}
        className="flex flex-col items-center gap-2.5 min-w-[76px]"
      >
        <div className="
          w-[76px] h-[76px]
          bg-ivory rounded-full
          flex items-center justify-center
          overflow-hidden
          border-2 border-stone/30
          hover:border-sage/50
          hover:shadow-card
          transition-all duration-300
        ">
          {category.image ? (
            <img
              src={category.image}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-3xl">{category.icon || '📦'}</span>
          )}
        </div>
        <span className="
          text-xs text-dark-gray font-medium
          text-center line-clamp-2
        ">
          {name}
        </span>
      </motion.button>
    )
  }

  // ===== CARD VARIANT (лендинг стиль — с overlay) =====
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/catalog/${category.slug}`)}
      className="
        relative rounded-3xl overflow-hidden
        cursor-pointer
        aspect-[3/4]
        group
        transition-shadow duration-400
        hover:shadow-card-hover
      "
    >
      {/* Image */}
      {category.image ? (
        <img
          src={category.image}
          alt={name}
          className="
            absolute inset-0 w-full h-full
            object-cover
            transition-transform duration-600
            group-hover:scale-[1.08]
          "
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-forest to-sage flex items-center justify-center">
          <span className="text-6xl">{category.icon || '📦'}</span>
        </div>
      )}

      {/* Overlay gradient */}
      <div className="
        absolute inset-0
        bg-gradient-to-t
        from-black/60 via-black/10 to-transparent
      " />

      {/* Content */}
      <div className="absolute bottom-5 left-5 right-5 z-[2]">
        <div className="font-display text-lg font-medium text-white leading-[1.3]">
          {name}
        </div>
        {category.productCount !== undefined && (
          <div className="text-xs text-white/70 mt-1 font-medium">
            {category.productCount} {language === 'uz' ? 'ta mahsulot' : 'товаров'}
          </div>
        )}
      </div>
    </motion.div>
  )
})