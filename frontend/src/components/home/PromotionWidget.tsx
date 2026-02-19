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
import { cn } from '@/utils/helpers'

const typeConfig: Record<string, {
  icon: any
  gradient: string
  emoji: string
}> = {
  SALE: { icon: Tag, gradient: 'from-terracotta to-red-400', emoji: '🔥' },
  COLLECTION: { icon: Star, gradient: 'from-forest to-emerald', emoji: '⭐' },
  LIMITED: { icon: Sparkles, gradient: 'from-amber-500 to-warning', emoji: '✨' },
  NEW_ARRIVALS: { icon: Gift, gradient: 'from-blue-500 to-sky-400', emoji: '🎁' },
}

export function PromotionWidget() {
  const navigate = useNavigate()
  const { language } = useLanguageStore()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const data = await promotionService.getActivePromotions()
        setPromotions(data)
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [])

  if (isLoading || promotions.length === 0) return null

  return (
    <section className="py-6">
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

        <div className="flex gap-3.5 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/promotion/${promo.slug}`)}
                className="flex-none w-[300px] snap-start cursor-pointer group"
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
                  {/* Pattern */}
                  <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2l2 3-2 3z'/%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  />

                  {/* Decorative emoji */}
                  <div className="absolute -right-2 -top-2 text-[60px] opacity-[0.15] rotate-12">
                    {config.emoji}
                  </div>

                  {/* Top */}
                  <div className="relative z-[2]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                        <TypeIcon className="w-3.5 h-3.5" />
                      </div>
                      {daysLeft > 0 && daysLeft <= 7 && (
                        <Badge variant="outline" className="text-white border-white/30 text-[11px]">
                          <Clock className="w-3 h-3 mr-1" />
                          {daysLeft} {language === 'uz' ? 'kun' : 'дн.'}
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-display text-lg font-medium leading-tight mb-1.5 line-clamp-2">
                      {name}
                    </h3>

                    {description && (
                      <p className="text-white/75 text-[13px] leading-relaxed line-clamp-2">
                        {description}
                      </p>
                    )}
                  </div>

                  {/* Bottom */}
                  <div className="relative z-[2] flex items-center justify-between mt-4">
                    <span className="text-white/70 text-[12px] font-medium">
                      {productsCount} {language === 'uz' ? 'ta mahsulot' : 'товаров'}
                    </span>
                    <div className="flex items-center gap-1 text-[13px] font-semibold group-hover:gap-2 transition-all duration-300">
                      {language === 'uz' ? "Ko'rish" : 'Смотреть'}
                      <ChevronRight className="w-4 h-4" />
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