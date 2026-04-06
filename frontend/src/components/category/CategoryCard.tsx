import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Category } from '@/types'
import { useLanguageStore } from '@/store/languageStore'
import { getCategoryName } from '@/utils/helpers'

// ── SVG иконки по теме ────────────────────────────────────────────────────
const CategoryIcon = ({ slug, size = 48 }: { slug: string; size?: number }) => {
  const s = slug.toLowerCase()

  // Декоративные ветки / Branch
  if (s.includes('branch') || s.includes('shox') || s.includes('vetk')) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path d="M24 40 C24 40 12 28 12 18 C12 11 17 7 24 7 C31 7 36 11 36 18 C36 28 24 40 24 40Z"
          stroke="#2C5F2E" strokeWidth="2" fill="none"/>
        <path d="M24 20 L16 12M24 26 L34 16M24 32 L18 26"
          stroke="#2C5F2E" strokeWidth="2" strokeLinecap="round"/>
        <line x1="24" y1="7" x2="24" y2="40"
          stroke="#2C5F2E" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  }

  // Мини-цветы / Mini flowers
  if (s.includes('gul') || s.includes('tsvet') || s.includes('flower') || s.includes('mini')) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="20" r="4" fill="#8B5E3C"/>
        <ellipse cx="24" cy="12" rx="4" ry="6" fill="#2C5F2E" opacity="0.8"/>
        <ellipse cx="24" cy="28" rx="4" ry="6" fill="#2C5F2E" opacity="0.8"/>
        <ellipse cx="16" cy="20" rx="6" ry="4" fill="#2C5F2E" opacity="0.8"/>
        <ellipse cx="32" cy="20" rx="6" ry="4" fill="#2C5F2E" opacity="0.8"/>
        <ellipse cx="18" cy="14" rx="4" ry="5" fill="#4a8c4f" opacity="0.6"
          transform="rotate(-45 18 14)"/>
        <ellipse cx="30" cy="14" rx="4" ry="5" fill="#4a8c4f" opacity="0.6"
          transform="rotate(45 30 14)"/>
        <rect x="22" y="28" width="4" height="10" rx="2" fill="#8B5E3C"/>
        <ellipse cx="24" cy="40" rx="6" ry="2" fill="#8B5E3C" opacity="0.3"/>
      </svg>
    )
  }

  // Сетки / Setka / Панели сетка
  if (s.includes('setka') || s.includes('setk') || s.includes('panel') && s.includes('zelen')) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <rect x="6" y="6" width="36" height="36" rx="4"
          stroke="#2C5F2E" strokeWidth="2" fill="none"/>
        <line x1="6" y1="18" x2="42" y2="18" stroke="#2C5F2E" strokeWidth="1.5" opacity="0.6"/>
        <line x1="6" y1="30" x2="42" y2="30" stroke="#2C5F2E" strokeWidth="1.5" opacity="0.6"/>
        <line x1="18" y1="6" x2="18" y2="42" stroke="#2C5F2E" strokeWidth="1.5" opacity="0.6"/>
        <line x1="30" y1="6" x2="30" y2="42" stroke="#2C5F2E" strokeWidth="1.5" opacity="0.6"/>
        <circle cx="18" cy="18" r="2.5" fill="#4a8c4f"/>
        <circle cx="30" cy="18" r="2.5" fill="#4a8c4f"/>
        <circle cx="18" cy="30" r="2.5" fill="#4a8c4f"/>
        <circle cx="30" cy="30" r="2.5" fill="#4a8c4f"/>
        <circle cx="24" cy="24" r="3" fill="#2C5F2E"/>
      </svg>
    )
  }

  // Моховые панели / Mox
  if (s.includes('mox') || s.includes('mokh') || s.includes('moss')) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <rect x="6" y="14" width="36" height="24" rx="6"
          fill="#2C5F2E" opacity="0.15" stroke="#2C5F2E" strokeWidth="2"/>
        <circle cx="14" cy="22" r="5" fill="#2C5F2E" opacity="0.7"/>
        <circle cx="24" cy="19" r="6" fill="#2C5F2E" opacity="0.9"/>
        <circle cx="34" cy="22" r="5" fill="#2C5F2E" opacity="0.7"/>
        <circle cx="19" cy="30" r="5" fill="#4a8c4f" opacity="0.8"/>
        <circle cx="30" cy="30" r="5" fill="#4a8c4f" opacity="0.8"/>
        <circle cx="14" cy="32" r="3" fill="#2C5F2E" opacity="0.5"/>
        <circle cx="36" cy="31" r="3" fill="#2C5F2E" opacity="0.5"/>
      </svg>
    )
  }

  // Кашпо и горшки / Kashpo / Gorshki
  if (s.includes('kashpo') || s.includes('gorshk') || s.includes('tuv') || s.includes('premium')) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path d="M16 18 L14 38 Q14 40 16 40 L32 40 Q34 40 34 38 L32 18 Z"
          fill="#8B5E3C" opacity="0.2" stroke="#8B5E3C" strokeWidth="2"/>
        <rect x="13" y="14" width="22" height="6" rx="3"
          fill="#8B5E3C" opacity="0.8"/>
        <path d="M20 14 C20 10 22 8 24 8 C26 8 28 10 28 14"
          stroke="#2C5F2E" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <circle cx="24" cy="7" r="2" fill="#2C5F2E"/>
        <ellipse cx="24" cy="10" rx="3" ry="4" fill="#2C5F2E" opacity="0.7"/>
      </svg>
    )
  }

  // Декоративные деревья / Trees
  if (s.includes('tree') || s.includes('daraxt') || s.includes('derevo') || s.includes('trees')) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <polygon points="24,6 36,26 12,26" fill="#2C5F2E" opacity="0.9"/>
        <polygon points="24,16 38,34 10,34" fill="#2C5F2E" opacity="0.8"/>
        <rect x="21" y="34" width="6" height="8" rx="2" fill="#8B5E3C"/>
        <circle cx="18" cy="20" r="3" fill="#4a8c4f" opacity="0.6"/>
        <circle cx="30" cy="22" r="2.5" fill="#4a8c4f" opacity="0.6"/>
      </svg>
    )
  }

  // Декоративная зелень / Kompozitsiya / точка slug
  if (s.includes('kompozit') || s.includes('zelen') || s.includes('green') || s === '.') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path d="M24 38 C24 38 10 26 10 16 C10 10 16 6 24 6"
          stroke="#2C5F2E" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M24 38 C24 38 38 26 38 16 C38 10 32 6 24 6"
          stroke="#4a8c4f" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <ellipse cx="16" cy="14" rx="7" ry="5" fill="#2C5F2E" opacity="0.7"
          transform="rotate(-30 16 14)"/>
        <ellipse cx="32" cy="14" rx="7" ry="5" fill="#4a8c4f" opacity="0.7"
          transform="rotate(30 32 14)"/>
        <ellipse cx="24" cy="10" rx="6" ry="4" fill="#2C5F2E" opacity="0.9"/>
        <line x1="24" y1="38" x2="24" y2="44"
          stroke="#8B5E3C" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    )
  }

  // Подвесные растения / Visyachka
  if (s.includes('visyach') || s.includes('osma') || s.includes('podves') || s.includes('hang')) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <line x1="24" y1="4" x2="24" y2="14"
          stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="4" x2="24" y2="4"
          stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round"/>
        <line x1="34" y1="4" x2="24" y2="4"
          stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round"/>
        <path d="M14 14 Q24 10 34 14 Q38 22 34 28 Q24 34 14 28 Q10 22 14 14Z"
          fill="#2C5F2E" opacity="0.85"/>
        <path d="M18 18 Q24 14 30 18" stroke="#4a8c4f" strokeWidth="1.5"
          fill="none" strokeLinecap="round"/>
        <path d="M16 24 Q24 20 32 24" stroke="#4a8c4f" strokeWidth="1.5"
          fill="none" strokeLinecap="round"/>
        <path d="M18 30 Q24 27 30 30"
          stroke="#4a8c4f" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <line x1="20" y1="34" x2="18" y2="42"
          stroke="#2C5F2E" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="24" y1="34" x2="24" y2="43"
          stroke="#2C5F2E" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="28" y1="34" x2="30" y2="42"
          stroke="#2C5F2E" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }

  // Default fallback
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="20" r="10" fill="#2C5F2E" opacity="0.8"/>
      <path d="M20 30 Q24 28 28 30 L26 42 Q24 44 22 42 Z"
        fill="#8B5E3C" opacity="0.8"/>
      <path d="M17 16 Q24 10 31 16" stroke="#4a8c4f" strokeWidth="1.5"
        fill="none" strokeLinecap="round"/>
      <path d="M15 20 Q24 14 33 20" stroke="#4a8c4f" strokeWidth="1.5"
        fill="none" strokeLinecap="round"/>
    </svg>
  )
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
  const hasImage = category.image && category.image.trim() !== ''

  // ===== CIRCLE VARIANT =====
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
          {hasImage ? (
            <img
              src={category.image}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <CategoryIcon slug={category.slug} size={40} />
          )}
        </div>
        <span className="text-xs text-dark-gray font-medium text-center line-clamp-2">
          {name}
        </span>
      </motion.button>
    )
  }

  // ===== CARD VARIANT =====
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
      {hasImage ? (
        <img
          src={category.image}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover
            transition-transform duration-600 group-hover:scale-[1.08]"
          loading="lazy"
        />
      ) : (
        // ── Красивый fallback без фото ──────────────────────────────────
        <div className="
          absolute inset-0
          bg-gradient-to-br from-[#f5f0eb] to-[#e8f0e9]
          flex flex-col items-center justify-center
          gap-3
        ">
          {/* Декоративный круг */}
          <div className="
            w-20 h-20 rounded-full
            bg-white/70
            flex items-center justify-center
            shadow-sm
            group-hover:scale-110
            transition-transform duration-300
          ">
            <CategoryIcon slug={category.slug} size={48} />
          </div>
        </div>
      )}

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