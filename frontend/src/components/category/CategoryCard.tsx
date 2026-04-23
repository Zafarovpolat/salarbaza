import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Category } from '@/types'
import { useLanguageStore } from '@/store/languageStore'
import { getCategoryName } from '@/utils/helpers'

// ── Fallback фото по slug ────────────────────────────────────────────────────
// Используются только если у категории нет своей картинки И нет ни одного
// товара с фото. В нормальной ситуации подставляется:
//   1) category.image (если задана в админке), либо
//   2) фото последнего добавленного товара категории (latestProductImage).
const FALLBACK_PHOTOS = {
  branches:
    'https://images.unsplash.com/photo-1759833307567-eea43aac45e6?w=600&h=600&fit=crop&q=80',
  flowers:
    'https://images.unsplash.com/photo-1773809407796-475cb516d7ec?w=600&h=600&fit=crop&q=80',
  nets:
    'https://images.unsplash.com/photo-1746347518469-f529bde982ab?w=600&h=600&fit=crop&q=80',
  moss:
    'https://images.unsplash.com/photo-1689519313062-f3e61e5d30b2?w=600&h=600&fit=crop&q=80',
  pots:
    'https://images.unsplash.com/photo-1594009756326-6bb1d980dbf6?w=600&h=600&fit=crop&q=80',
  trees:
    'https://images.unsplash.com/photo-1762542531473-ec9f86e0d86e?w=600&h=600&fit=crop&q=80',
  hanging:
    'https://images.unsplash.com/photo-1746450912857-60bdc3b5d8df?w=600&h=600&fit=crop&q=80',
  compositions:
    'https://images.unsplash.com/photo-1769812343628-5a2d12f297f7?w=600&h=600&fit=crop&q=80',
} as const

function getFallbackPhoto(slug: string): string {
  const s = slug.toLowerCase()
  if (s.includes('branch') || s.includes('shox') || s.includes('vetk') || s.includes('sun') || s.includes('iskust')) {
    return FALLBACK_PHOTOS.branches
  }
  if (s.includes('gul') || s.includes('tsvet') || s.includes('mini') || s.includes('flower') || s.includes('tayyor')) {
    return FALLBACK_PHOTOS.flowers
  }
  if (s.includes('setka') || s.includes('setk') || s.includes('grid') || s.includes('yashil')) {
    return FALLBACK_PHOTOS.nets
  }
  if (s.includes('mox') || s.includes('mokh') || s.includes('moss') || s.includes('panel')) {
    return FALLBACK_PHOTOS.moss
  }
  if (s.includes('kashpo') || s.includes('gorshk') || s.includes('tuv') || s.includes('premium') || s.includes('pot')) {
    return FALLBACK_PHOTOS.pots
  }
  if (s.includes('tree') || s.includes('daraxt') || s.includes('derevo')) {
    return FALLBACK_PHOTOS.trees
  }
  if (s.includes('visyach') || s.includes('osma') || s.includes('podves') || s.includes('hang')) {
    return FALLBACK_PHOTOS.hanging
  }
  return FALLBACK_PHOTOS.compositions
}

// ─────────────────────────────────────────────────────────────────────────────

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
  const imageSrc =
    (category.image && category.image.trim() !== '' && category.image) ||
    (category.latestProductImage && category.latestProductImage.trim() !== '' && category.latestProductImage) ||
    getFallbackPhoto(category.slug)

  // ===== CIRCLE VARIANT — large rounded square 140×140 with photo =====
  if (variant === 'circle') {
    return (
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => navigate(`/catalog/${category.slug}`)}
        className="flex flex-col items-center gap-2.5 w-[148px] group"
      >
        <div className="
          w-[140px] h-[140px]
          rounded-[22px]
          overflow-hidden
          bg-white
          border border-stone/40
          shadow-[0_8px_22px_rgba(27,67,50,0.10)]
          transition-all duration-400 ease-out
          group-hover:border-sage/50
          group-hover:shadow-[0_10px_28px_rgba(27,67,50,0.16)]
          group-hover:-translate-y-0.5
        ">
          <img
            src={imageSrc}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        </div>

        <span className="
          text-[13px] text-dark-gray font-medium
          text-center leading-[1.25]
          line-clamp-2 w-full
          transition-colors duration-300
          group-hover:text-forest
        ">
          {name}
        </span>
      </motion.button>
    )
  }

  // ===== CARD VARIANT — tall tile with overlay title =====
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
        cursor-pointer aspect-[3/4]
        group transition-shadow duration-400
        hover:shadow-card-hover
      "
    >
      <img
        src={imageSrc}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover
          transition-transform duration-600 group-hover:scale-[1.08]"
        loading="lazy"
      />

      {/* Overlay gradient */}
      <div className="
        absolute inset-0
        bg-gradient-to-t
        from-black/55 via-black/5 to-transparent
      "/>

      {/* Content */}
      <div className="absolute bottom-5 left-5 right-5 z-[2]">
        <div className="font-display text-lg font-medium text-white leading-[1.3] drop-shadow">
          {name}
        </div>
        {category.productCount !== undefined && (
          <div className="text-xs text-white/75 mt-1 font-medium">
            {category.productCount} {language === 'uz' ? 'ta mahsulot' : 'товаров'}
          </div>
        )}
      </div>
    </motion.div>
  )
})
