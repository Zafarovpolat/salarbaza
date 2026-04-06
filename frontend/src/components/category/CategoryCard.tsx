import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Category } from '@/types'
import { useLanguageStore } from '@/store/languageStore'
import { getCategoryName } from '@/utils/helpers'

// ── SVG иконки по теме ────────────────────────────────────────────────────
const CategoryIcon = ({ slug, size = 28 }: { slug: string; size?: number }) => {
  const s = slug.toLowerCase()
  
  // Цвета:
  const main = "#1B4332" // forest
  const accent = "#C67C4E" // terracotta
  const light = "#40916C" // sage

  const svgProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: main,
    strokeWidth: "1.2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }

  // 1. Декоративные ветки (Branch)
  if (s.includes('branch') || s.includes('shox') || s.includes('vetk')) {
    return (
      <svg {...svgProps}>
        <path d="M12 22C12 22 12 13 15 5C16 2 19 2 19 2" />
        <path d="M15 5C13 4 10 5 10 5C10 5 11 8 15 5Z" stroke={accent} />
        <path d="M13 10C10 9 7 10 7 10C7 10 8 13 13 10Z" fill="rgba(64,145,108,0.1)" stroke={light} />
        <path d="M12 16C15 15 18 16 18 16C18 16 17 19 12 16Z" fill="rgba(64,145,108,0.1)" stroke={light} />
      </svg>
    )
  }

  // 2. Готовые мини-цветы
  if (s.includes('gul') || s.includes('tsvet') || s.includes('mini')) {
    return (
      <svg {...svgProps}>
        <path d="M8 16H16L15 22H9L8 16Z" stroke={accent} />
        <path d="M12 16V9" />
        <path d="M12 16C10 13 9 11 9 11" stroke={light} />
        <path d="M12 16C14 13 15 11 15 11" stroke={light} />
        <circle cx="12" cy="7" r="1.5" />
        <circle cx="8" cy="9" r="1.5" />
        <circle cx="16" cy="9" r="1.5" />
      </svg>
    )
  }

  // 3. Декоративные сетки
  if (s.includes('setka') || s.includes('setk')) {
    return (
      <svg {...svgProps}>
        <rect x="4" y="4" width="16" height="16" rx="1" strokeOpacity="0.3" />
        <path d="M9 4V20M15 4V20M4 9H20M4 15H20" strokeOpacity="0.3" />
        <path d="M4 20C9 20 14 13 20 4" stroke={light} />
        <path d="M14 13C14 11 12 11 12 11C12 11 13 14 14 13Z" stroke={accent} />
      </svg>
    )
  }

  // 4. Моховые панели
  if (s.includes('mox') || s.includes('mokh') || s.includes('moss')) {
    return (
      <svg {...svgProps}>
        <rect x="3" y="5" width="18" height="14" rx="2" strokeOpacity="0.4" />
        <path d="M3 13C6 13 8 10 12 12C16 14 18 10 21 10" stroke={light} />
        <path d="M3 16C6 14 8 17 12 15C16 13 18 16 21 16" stroke={main} />
        <path d="M3 9C5 9 7 6 11 8C15 10 17 7 21 8" stroke={light} />
      </svg>
    )
  }

  // 5. Премиальные кашпо
  if (s.includes('kashpo') || s.includes('gorshk') || s.includes('tuv') || s.includes('premium')) {
    return (
      <svg {...svgProps}>
        <path d="M6 14L8 22H16L18 14Z" stroke={accent} />
        <path d="M5 12H19" stroke={accent} />
        <path d="M12 12V4C12 4 16 5 16 8C16 11 12 12 12 12Z" fill="rgba(64,145,108,0.1)" stroke={light} />
        <path d="M12 12V6C12 6 8 7 8 9C8 12 12 12 12 12Z" />
      </svg>
    )
  }

  // 6. Деревья
  if (s.includes('tree') || s.includes('daraxt') || s.includes('derevo')) {
    return (
      <svg {...svgProps}>
        <path d="M12 20V11" />
        <path d="M10 20H14L13 23H11L10 20Z" stroke={accent} />
        <path d="M12 11C12 11 17 11 17 6C17 3 14 2 12 2C10 2 7 3 7 6C7 11 12 11 12 11Z" fill="rgba(27,67,50,0.04)" />
        <path d="M10 7C10 5 12 4 12 4" stroke={light} />
      </svg>
    )
  }

  // 7. Подвесные растения
  if (s.includes('visyach') || s.includes('osma') || s.includes('podves')) {
    return (
      <svg {...svgProps}>
        <path d="M12 2V4" />
        <path d="M12 4L8 10M12 4L16 10" strokeOpacity="0.4" strokeDasharray="1 1" />
        <path d="M6 10C6 13.3 8.7 16 12 16C15.3 16 18 13.3 18 10H6Z" stroke={accent} />
        <path d="M9 16C9 18 8 19 9 22" stroke={light} />
        <path d="M12 16V22" />
        <path d="M15 16C15 18 16 19 15 21" stroke={light} />
      </svg>
    )
  }

  // 8. Композиции (Декоративная зелень)
  return (
    <svg {...svgProps}>
      <path d="M12 21C12 21 12 13 18 7C18 7 20 13 12 21Z" />
      <path d="M10 21C10 21 10 15 4 9C4 9 2 15 10 21Z" fill="rgba(64,145,108,0.1)" stroke={light} />
      <path d="M12 21L11 16M10 21L11 16L11 23" />
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
        className="flex flex-col items-center gap-2.5 w-[76px] group"
      >
        {/* Изящный премиальный круг */}
        <div className="
          w-[68px] h-[68px]
          rounded-full
          flex items-center justify-center
          overflow-hidden
          bg-white
          border border-stone/50
          shadow-[0_2px_12px_rgba(0,0,0,0.03)]
          transition-all duration-400 ease-out
          group-hover:border-sage/40
          group-hover:shadow-[0_4px_20px_rgba(27,67,50,0.08)]
          group-hover:-translate-y-0.5
        ">
          {hasImage ? (
            <img
              src={category.image}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="transition-transform duration-500 group-hover:scale-110">
              <CategoryIcon slug={category.slug} />
            </div>
          )}
        </div>
        
        {/* Текст */}
        <span className="
          text-[11px] text-dark-gray font-medium
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