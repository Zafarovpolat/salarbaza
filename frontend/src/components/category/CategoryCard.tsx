import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Category } from '@/types'
import { useLanguageStore } from '@/store/languageStore'
import { getCategoryName } from '@/utils/helpers'

// ── SVG иконки по теме ────────────────────────────────────────────────────
const CategoryIcon = ({ slug, size = 36 }: { slug: string; size?: number }) => {
  const s = slug.toLowerCase()

  // forest=#1B4332  sage=#40916C  terracotta=#C67C4E  mint=#52B788

  if (s.includes('branch') || s.includes('shox') || s.includes('vetk')) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <line x1="24" y1="42" x2="24" y2="8"
          stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M24 28 Q16 22 10 16"
          stroke="#40916C" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M24 22 Q32 16 38 10"
          stroke="#40916C" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M24 34 Q18 30 14 26"
          stroke="#40916C" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <ellipse cx="10" cy="14" rx="5" ry="4"
          fill="#40916C" opacity="0.7" transform="rotate(-30 10 14)"/>
        <ellipse cx="38" cy="9" rx="5" ry="4"
          fill="#52B788" opacity="0.7" transform="rotate(20 38 9)"/>
        <ellipse cx="13" cy="25" rx="4" ry="3"
          fill="#40916C" opacity="0.6" transform="rotate(-20 13 25)"/>
      </svg>
    )
  }

  if (s.includes('gul') || s.includes('tsvet') || s.includes('flower') || s.includes('mini')) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="22" r="5" fill="#C67C4E"/>
        <ellipse cx="24" cy="13" rx="4.5" ry="6" fill="#1B4332" opacity="0.85"/>
        <ellipse cx="24" cy="31" rx="4.5" ry="6" fill="#1B4332" opacity="0.85"/>
        <ellipse cx="15" cy="22" rx="6" ry="4.5" fill="#40916C" opacity="0.85"/>
        <ellipse cx="33" cy="22" rx="6" ry="4.5" fill="#40916C" opacity="0.85"/>
        <ellipse cx="17" cy="15" rx="4" ry="5"
          fill="#52B788" opacity="0.65" transform="rotate(-45 17 15)"/>
        <ellipse cx="31" cy="15" rx="4" ry="5"
          fill="#52B788" opacity="0.65" transform="rotate(45 31 15)"/>
        <rect x="22" y="31" width="4" height="9" rx="2" fill="#C67C4E"/>
        <ellipse cx="24" cy="41" rx="5" ry="1.5" fill="#C67C4E" opacity="0.25"/>
      </svg>
    )
  }

  if (s.includes('setka') || s.includes('setk')) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <rect x="7" y="7" width="34" height="34" rx="5"
          stroke="#1B4332" strokeWidth="2" fill="none"/>
        <line x1="7" y1="18.3" x2="41" y2="18.3"
          stroke="#40916C" strokeWidth="1.5" opacity="0.7"/>
        <line x1="7" y1="29.6" x2="41" y2="29.6"
          stroke="#40916C" strokeWidth="1.5" opacity="0.7"/>
        <line x1="18.3" y1="7" x2="18.3" y2="41"
          stroke="#40916C" strokeWidth="1.5" opacity="0.7"/>
        <line x1="29.6" y1="7" x2="29.6" y2="41"
          stroke="#40916C" strokeWidth="1.5" opacity="0.7"/>
        <circle cx="18.3" cy="18.3" r="2.5" fill="#52B788"/>
        <circle cx="29.6" cy="18.3" r="2.5" fill="#52B788"/>
        <circle cx="18.3" cy="29.6" r="2.5" fill="#52B788"/>
        <circle cx="29.6" cy="29.6" r="2.5" fill="#52B788"/>
        <circle cx="24" cy="24" r="3.5" fill="#1B4332"/>
      </svg>
    )
  }

  if (s.includes('mox') || s.includes('mokh') || s.includes('moss')) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <rect x="6" y="16" width="36" height="22" rx="7"
          fill="#1B4332" opacity="0.12" stroke="#1B4332" strokeWidth="2"/>
        <circle cx="14" cy="23" r="5.5" fill="#1B4332" opacity="0.75"/>
        <circle cx="24" cy="20" r="7"   fill="#1B4332" opacity="0.9"/>
        <circle cx="34" cy="23" r="5.5" fill="#1B4332" opacity="0.75"/>
        <circle cx="19" cy="31" r="5"   fill="#40916C" opacity="0.8"/>
        <circle cx="30" cy="31" r="5"   fill="#40916C" opacity="0.8"/>
        <circle cx="12" cy="33" r="3"   fill="#52B788" opacity="0.6"/>
        <circle cx="36" cy="33" r="3"   fill="#52B788" opacity="0.6"/>
      </svg>
    )
  }

  if (s.includes('kashpo') || s.includes('gorshk') || s.includes('tuv') || s.includes('premium')) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path d="M15 19 L13 38 Q13 40 16 40 L32 40 Q35 40 35 38 L33 19 Z"
          fill="#C67C4E" opacity="0.2" stroke="#C67C4E" strokeWidth="2"/>
        <rect x="12" y="15" width="24" height="6" rx="3"
          fill="#C67C4E" opacity="0.85"/>
        <path d="M20 15 C20 9 22 6 24 6 C26 6 28 9 28 15"
          stroke="#1B4332" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="24" cy="5" r="2.5" fill="#40916C"/>
        <ellipse cx="24" cy="10" rx="4" ry="5" fill="#40916C" opacity="0.7"/>
      </svg>
    )
  }

  if (s.includes('tree') || s.includes('daraxt') || s.includes('derevo') || s === 'trees') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <polygon points="24,5 37,25 11,25" fill="#1B4332" opacity="0.9"/>
        <polygon points="24,15 39,34 9,34"  fill="#40916C" opacity="0.85"/>
        <rect x="21" y="34" width="6" height="8" rx="2" fill="#C67C4E"/>
        <circle cx="17" cy="19" r="2.5" fill="#52B788" opacity="0.7"/>
        <circle cx="31" cy="21" r="2"   fill="#52B788" opacity="0.7"/>
      </svg>
    )
  }

  if (s.includes('kompozit') || s.includes('zelen') || s === '.') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path d="M24 38 C24 38 9 25 9 15 C9 9 15 5 24 5"
          stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M24 38 C24 38 39 25 39 15 C39 9 33 5 24 5"
          stroke="#40916C" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <ellipse cx="15" cy="13" rx="7" ry="5"
          fill="#1B4332" opacity="0.75" transform="rotate(-30 15 13)"/>
        <ellipse cx="33" cy="13" rx="7" ry="5"
          fill="#40916C" opacity="0.75" transform="rotate(30 33 13)"/>
        <ellipse cx="24" cy="9"  rx="6" ry="4" fill="#1B4332" opacity="0.9"/>
        <line x1="24" y1="38" x2="24" y2="44"
          stroke="#C67C4E" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    )
  }

  if (s.includes('visyach') || s.includes('osma') || s.includes('podves')) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <line x1="12" y1="5" x2="36" y2="5"
          stroke="#C67C4E" strokeWidth="2" strokeLinecap="round"/>
        <line x1="24" y1="5" x2="24" y2="14"
          stroke="#C67C4E" strokeWidth="2" strokeLinecap="round"/>
        <path d="M13 14 Q24 9 35 14 Q39 23 35 30 Q24 36 13 30 Q9 23 13 14Z"
          fill="#1B4332" opacity="0.85"/>
        <path d="M17 19 Q24 15 31 19"
          stroke="#52B788" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M15 25 Q24 21 33 25"
          stroke="#52B788" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <line x1="19" y1="35" x2="17" y2="43"
          stroke="#40916C" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="24" y1="36" x2="24" y2="44"
          stroke="#40916C" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="29" y1="35" x2="31" y2="43"
          stroke="#40916C" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }

  // Default
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="22" rx="11" ry="13" fill="#1B4332" opacity="0.85"/>
      <path d="M19 18 Q24 13 29 18" stroke="#52B788" strokeWidth="1.5"
        fill="none" strokeLinecap="round"/>
      <path d="M17 23 Q24 18 31 23" stroke="#52B788" strokeWidth="1.5"
        fill="none" strokeLinecap="round"/>
      <rect x="22" y="33" width="4" height="8" rx="2" fill="#C67C4E"/>
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
      className="flex flex-col items-center gap-2 min-w-[72px] max-w-[72px]"
    >
      {/* Круг */}
      <div className="
        w-[68px] h-[68px]
        rounded-full
        flex items-center justify-center
        overflow-hidden
        border-2 border-stone/40
        transition-all duration-300
        hover:border-sage/60
        hover:shadow-soft
        bg-ivory
      ">
        {hasImage ? (
          <img
            src={category.image}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <CategoryIcon slug={category.slug} size={36} />
        )}
      </div>

      {/* Название */}
      <span className="
        text-[11px] text-dark-gray font-medium
        text-center leading-[1.3]
        line-clamp-2 w-full
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