// frontend/src/components/home/PromotionWidget.tsx

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Clock, Tag, Gift, Sparkles, Star } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { promotionService } from '@/services/promotionService'
import { Promotion } from '@/types'
import { Container } from '@/components/layout/Container'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/helpers'

// ====== Кэш + прелоад ======
// Цель: на повторных заходах акции рендерятся мгновенно; на холодном старте
// запрос летит максимально рано (на импорте модуля), чтобы к маунту виджета
// данные уже были.

const CACHE_TTL = 60_000 // 1 минута
const STORAGE_KEY = 'promotions_cache_v1'

let cachedPromotions: Promotion[] | null = null
let cacheTime = 0
let pendingPromise: Promise<Promotion[]> | null = null

// Seed cache из sessionStorage (переживает refresh страницы)
if (typeof window !== 'undefined') {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { data: Promotion[]; time: number }
      if (parsed?.data && Date.now() - parsed.time < CACHE_TTL) {
        cachedPromotions = parsed.data
        cacheTime = parsed.time
      }
    }
  } catch {
    // ignore
  }
}

export function preloadPromotions(): Promise<Promotion[]> {
  // Свежий кэш — ничего не делаем
  if (cachedPromotions && Date.now() - cacheTime < CACHE_TTL) {
    return Promise.resolve(cachedPromotions)
  }
  // Уже идёт запрос — переиспользуем
  if (pendingPromise) return pendingPromise

  pendingPromise = promotionService
    .getActivePromotions()
    .then((data) => {
      cachedPromotions = data
      cacheTime = Date.now()
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ data, time: cacheTime })
        )
      } catch {
        // ignore (private mode / quota)
      }
      return data
    })
    .catch((err) => {
      pendingPromise = null
      throw err
    })
    .finally(() => {
      pendingPromise = null
    })

  return pendingPromise
}

// Стартуем запрос сразу при импорте модуля — до того, как HomePage смонтирует виджет
if (typeof window !== 'undefined' && !cachedPromotions) {
  preloadPromotions().catch(() => {
    // Silently fail
  })
}

const typeConfig: Record<string, {
  icon: any
  gradient: string
  bgPattern: string
}> = {
  SALE: {
    icon: Tag,
    gradient: 'from-terracotta to-red-400',
    bgPattern: '🌸',
  },
  COLLECTION: {
    icon: Star,
    gradient: 'from-forest to-emerald',
    bgPattern: '🌿',
  },
  LIMITED: {
    icon: Sparkles,
    gradient: 'from-amber-500 to-warning',
    bgPattern: '✨',
  },
  NEW_ARRIVALS: {
    icon: Gift,
    gradient: 'from-blue-500 to-sky-400',
    bgPattern: '🌺',
  },
}

export function PromotionWidget() {
  const navigate = useNavigate()
  const { language } = useLanguageStore()
  // Стартуем с тем, что есть в кэше — экран не моргает
  const [promotions, setPromotions] = useState<Promotion[]>(cachedPromotions || [])
  const [loaded, setLoaded] = useState<boolean>(!!cachedPromotions)

  useEffect(() => {
    // Если кэш свежий — фоновый запрос не нужен
    if (cachedPromotions && Date.now() - cacheTime < CACHE_TTL) {
      setLoaded(true)
      return
    }

    let cancelled = false
    preloadPromotions()
      .then((data) => {
        if (!cancelled) {
          setPromotions(data)
          setLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Скелетон на первой загрузке — секция сразу резервирует место и не появляется «откуда-то»
  if (!loaded && promotions.length === 0) {
    return (
      <section className="py-4">
        <Container>
          <div className="flex items-end justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-terracotta to-red-400 rounded-xl flex items-center justify-center">
                <Tag className="w-4 h-4 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-2xl font-medium text-charcoal">
                {language === 'uz' ? 'Aksiyalar' : 'Акции'}
              </h2>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="w-full h-[180px] rounded-2xl" />
          </div>
        </Container>
      </section>
    )
  }

  // Запрос завершён, но акций нет — скрываем секцию
  if (promotions.length === 0) return null

  return (
    <section className="py-4">
      <Container>
        <div className="flex items-end justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-terracotta to-red-400 rounded-xl flex items-center justify-center">
              <Tag className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-2xl font-medium text-charcoal">
              {language === 'uz' ? 'Aksiyalar' : 'Акции'}
            </h2>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {promotions.map((promo, index) => {
            const config = typeConfig[promo.type] || typeConfig.SALE
            const TypeIcon = config.icon
            const name = language === 'uz' ? promo.nameUz : promo.nameRu
            const description = language === 'uz'
              ? (promo.descriptionUz || promo.descriptionRu)
              : promo.descriptionRu

            const endDate = new Date(promo.endDate)
            const now = new Date()
            const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            const productsCount = promo._count?.products || 0

            return (
              <motion.div
                key={promo.id}
                initial={cachedPromotions ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.12) }}
                onClick={() => navigate(`/promotion/${promo.slug}`)}
                className="w-full cursor-pointer group"
              >
                <div
                  className={cn(
                    'relative overflow-hidden rounded-2xl p-6',
                    'bg-gradient-to-br',
                    config.gradient,
                    'text-white min-h-[180px] flex flex-col justify-between',
                    'transition-all duration-400 hover:-translate-y-1 hover:shadow-card-strong'
                  )}
                >
                  {/* Decorative floral SVG pattern */}
                  <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" fill="white">
                      {/* Leaf cluster top-right */}
                      <g transform="translate(340, 20) rotate(15)">
                        <ellipse cx="0" cy="-20" rx="8" ry="22" />
                        <ellipse cx="14" cy="-14" rx="7" ry="20" transform="rotate(30)" />
                        <ellipse cx="-14" cy="-14" rx="7" ry="20" transform="rotate(-30)" />
                      </g>
                      {/* Flower bottom-left */}
                      <g transform="translate(40, 160)">
                        <circle cx="0" cy="0" r="6" />
                        <ellipse cx="0" cy="-14" rx="5" ry="10" />
                        <ellipse cx="13" cy="-4" rx="5" ry="10" transform="rotate(72)" />
                        <ellipse cx="8" cy="11" rx="5" ry="10" transform="rotate(144)" />
                        <ellipse cx="-8" cy="11" rx="5" ry="10" transform="rotate(216)" />
                        <ellipse cx="-13" cy="-4" rx="5" ry="10" transform="rotate(288)" />
                      </g>
                      {/* Scattered petals */}
                      <ellipse cx="120" cy="30" rx="4" ry="12" transform="rotate(-20, 120, 30)" />
                      <ellipse cx="280" cy="150" rx="5" ry="14" transform="rotate(40, 280, 150)" />
                      <circle cx="200" cy="100" r="3" />
                      <circle cx="320" cy="170" r="4" />
                      <ellipse cx="60" cy="60" rx="3" ry="10" transform="rotate(60, 60, 60)" />
                      {/* Stem curves */}
                      <path d="M350,200 Q330,140 360,80" strokeWidth="2" stroke="white" fill="none" />
                      <path d="M20,0 Q50,80 30,170" strokeWidth="1.5" stroke="white" fill="none" />
                    </svg>
                  </div>

                  {/* Decorative emoji — floral */}
                  <div className="absolute -right-3 -top-3 text-[70px] opacity-[0.12] rotate-12 pointer-events-none select-none">
                    {config.bgPattern}
                  </div>
                  <div className="absolute -left-2 -bottom-2 text-[50px] opacity-[0.08] -rotate-[20deg] pointer-events-none select-none">
                    🌿
                  </div>

                  {/* Top */}
                  <div className="relative z-[2]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      {daysLeft > 0 && daysLeft <= 14 && (
                        <Badge variant="outline" className="text-white border-white/30 text-[11px]">
                          <Clock className="w-3 h-3 mr-1" />
                          {daysLeft} {language === 'uz' ? 'kun' : 'дн.'}
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-display text-xl font-medium leading-tight mb-1.5">
                      {name}
                    </h3>

                    {description && (
                      <p className="text-white/80 text-[14px] leading-relaxed line-clamp-2 max-w-[85%]">
                        {description}
                      </p>
                    )}
                  </div>

                  {/* Bottom */}
                  <div className="relative z-[2] flex items-center justify-between mt-5">
                    <span className="text-white/70 text-[13px] font-medium">
                      {productsCount} {language === 'uz' ? 'ta mahsulot' : 'товаров'}
                    </span>
                    <div className="flex items-center gap-1.5 text-[14px] font-semibold bg-white/15 px-4 py-2 rounded-full group-hover:bg-white/25 transition-all duration-300">
                      {language === 'uz' ? "Ko\u2019rish" : 'Смотреть'}
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
