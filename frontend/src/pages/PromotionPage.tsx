// frontend/src/pages/PromotionPage.tsx

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Clock, Tag, Gift, Sparkles, Star, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { promotionService } from '@/services/promotionService'
import { Promotion } from '@/types'
import { Container } from '@/components/layout/Container'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/helpers'

export function PromotionPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { language } = useLanguageStore()

  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showRules, setShowRules] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)

    async function fetchPromotion() {
      if (!slug) return
      try {
        setIsLoading(true)
        setError(false)
        const data = await promotionService.getPromotionBySlug(slug)
        setPromotion(data)
      } catch {
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPromotion()
  }, [slug])

  if (isLoading) {
    return (
      <div className="pb-4">
        <Skeleton className="w-full h-[200px]" />
        <Container className="py-6 space-y-4">
          <Skeleton height={32} className="w-3/4" />
          <Skeleton height={16} className="w-full" />
          <Skeleton height={16} className="w-2/3" />
          <div className="grid grid-cols-2 gap-3 mt-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        </Container>
      </div>
    )
  }

  if (error || !promotion) {
    return (
      <Container className="py-12 text-center">
        <div className="text-6xl mb-4">🎁</div>
        <p className="text-medium-gray text-lg mb-2">
          {language === 'uz' ? 'Aksiya topilmadi' : 'Акция не найдена'}
        </p>
        <p className="text-sm text-light-gray mb-6">
          {language === 'uz'
            ? 'Bu aksiya tugagan yoki mavjud emas'
            : 'Эта акция завершена или не существует'}
        </p>
        <Button variant="green" onClick={() => navigate('/')}>
          {language === 'uz' ? 'Bosh sahifaga' : 'На главную'}
        </Button>
      </Container>
    )
  }

  const name = language === 'uz' ? promotion.nameUz : promotion.nameRu
  const description = language === 'uz' ? (promotion.descriptionUz || promotion.descriptionRu) : promotion.descriptionRu
  const rules = language === 'uz' ? (promotion.rulesUz || promotion.rulesRu) : promotion.rulesRu
  const products = promotion.products || []

  const endDate = new Date(promotion.endDate)
  const now = new Date()
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  const typeConfig: Record<string, { icon: any; colorClass: string; label: { ru: string; uz: string } }> = {
    SALE: { icon: Tag, colorClass: 'from-terracotta to-red-400', label: { ru: 'Акция со скидкой', uz: 'Chegirmali aksiya' } },
    COLLECTION: { icon: Star, colorClass: 'from-forest to-emerald', label: { ru: 'Подборка', uz: 'Tanlangan' } },
    LIMITED: { icon: Sparkles, colorClass: 'from-amber-500 to-warning', label: { ru: 'Ограниченная серия', uz: 'Cheklangan seriya' } },
    NEW_ARRIVALS: { icon: Gift, colorClass: 'from-blue-500 to-sky-400', label: { ru: 'Новинки', uz: 'Yangiliklar' } },
  }

  const config = typeConfig[promotion.type] || typeConfig.SALE
  const TypeIcon = config.icon

  return (
    <div className="pb-4">
      {/* ===== BANNER ===== */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'relative overflow-hidden mx-4 mt-3 rounded-3xl',
          'min-h-[220px] flex items-end'
        )}
      >
        {/* Gradient */}
        <div className={cn('absolute inset-0 bg-gradient-to-br z-0', config.colorClass)} />

        {/* Pattern */}
        <div
          className="absolute inset-0 opacity-[0.08] z-[1]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Banner image */}
        {promotion.image && (
          <img
            src={promotion.image}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover z-[1] opacity-30"
          />
        )}

        {/* Decorative */}
        <div className="absolute -right-10 -top-10 w-[200px] h-[200px] rounded-full bg-white/5 z-[1]" />
        <div className="absolute right-8 top-8 text-[80px] opacity-[0.12] z-[1]">🎁</div>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-[3] w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative z-[2] p-7 text-white w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <TypeIcon className="w-4 h-4" />
            </div>
            <Badge variant="outline" className="text-white border-white/30">
              {language === 'uz' ? config.label.uz : config.label.ru}
            </Badge>
          </div>

          <h1 className="font-display text-2xl md:text-3xl font-medium leading-[1.15] mb-2">
            {name}
          </h1>

          {daysLeft > 0 && (
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-2 text-[13px] font-medium">
              <Clock className="w-4 h-4" />
              {language === 'uz'
                ? `${daysLeft} kun qoldi`
                : `Осталось ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}`}
            </div>
          )}
        </div>
      </motion.section>

      {/* ===== DESCRIPTION ===== */}
      <section className="py-6">
        <Container className="space-y-4">
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-dark-gray leading-relaxed text-[15px]"
            >
              {description}
            </motion.p>
          )}

          {/* Rules toggle */}
          {rules && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <button
                onClick={() => setShowRules(!showRules)}
                className="flex items-center gap-2 text-forest font-semibold text-sm hover:text-emerald transition-colors"
              >
                <Info className="w-4 h-4" />
                {language === 'uz' ? 'Aksiya qoidalari' : 'Правила акции'}
                {showRules ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <AnimatePresence>
                {showRules && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-5 bg-ivory rounded-2xl border border-stone/30 text-dark-gray text-sm leading-relaxed whitespace-pre-line">
                      {rules}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Products count */}
          <div className="flex items-center gap-2 pt-2">
            <div className="w-8 h-8 bg-forest/10 rounded-xl flex items-center justify-center">
              <Gift className="w-4 h-4 text-forest" />
            </div>
            <span className="text-charcoal font-medium">
              {products.length} {language === 'uz' ? 'ta mahsulot' : 'товаров'}
            </span>
          </div>
        </Container>
      </section>

      {/* ===== PRODUCTS ===== */}
      <section className="pb-8">
        <Container>
          <ProductGrid products={products} isLoading={false} />

          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📦</div>
              <p className="text-medium-gray">
                {language === 'uz' ? 'Mahsulotlar topilmadi' : 'Товары не найдены'}
              </p>
            </div>
          )}
        </Container>
      </section>
    </div>
  )
}