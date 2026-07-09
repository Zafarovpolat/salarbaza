import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, ArrowLeft, Clock } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { promotionService } from '@/services/promotionService'
import { Product } from '@/types'
import { Container } from '@/components/layout/Container'
import { ProductGrid } from '@/components/product/ProductGrid'

const DAY_MS = 24 * 60 * 60 * 1000

function getDaysLeft(endDate: string | null) {
  if (!endDate) return null

  const diff = new Date(endDate).getTime() - Date.now()
  if (!Number.isFinite(diff) || diff < 0) return null

  return Math.ceil(diff / DAY_MS)
}

function formatDaysLeft(days: number, language: string) {
  if (language === 'uz') return `${days} kun qoldi`

  const mod10 = days % 10
  const mod100 = days % 100
  const word = mod10 === 1 && mod100 !== 11
    ? 'день'
    : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
      ? 'дня'
      : 'дней'

  return `Осталось ${days} ${word}`
}

export function SpecialOffersPage() {
  const navigate = useNavigate()
  const { language } = useLanguageStore()
  const [products, setProducts] = useState<Product[]>([])
  const [endsAt, setEndsAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        setIsLoading(true)
        const data = await promotionService.getSpecialOfferProducts(50)
        setProducts(data.products)
        setEndsAt(data.endsAt)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [])

  const daysLeft = getDaysLeft(endsAt)

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-terracotta to-red-400 mx-4 mt-3 rounded-3xl p-7 text-white relative overflow-hidden">
        <div className="absolute -right-5 -top-5 text-[80px] opacity-[0.12] rotate-12">🔥</div>
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-5 h-5" />
          <span className="text-sm font-medium opacity-80">
            {language === 'uz' ? 'Maxsus takliflar' : 'Спецпредложения'}
          </span>
        </div>
        <h1 className="font-display text-2xl font-medium">
          {language === 'uz' ? 'Barcha maxsus takliflar' : 'Все спецпредложения'}
        </h1>
        <p className="text-white/70 text-sm mt-1">
          {products.length} {language === 'uz' ? 'ta mahsulot' : 'товаров'}
        </p>
        {daysLeft !== null && (
          <div className="inline-flex items-center gap-2 bg-white/[0.12] rounded-full px-4 py-2 mt-3 text-[13px] text-white/90 font-medium">
            <Clock className="w-4 h-4 text-warning" strokeWidth={2} />
            {formatDaysLeft(daysLeft, language)}
          </div>
        )}
      </div>

      <section className="py-6">
        <Container>
          <ProductGrid products={products} isLoading={isLoading} />

          {!isLoading && products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🔥</div>
              <p className="text-gray-500">
                {language === 'uz' ? 'Hozircha maxsus takliflar yo\'q' : 'Пока нет спецпредложений'}
              </p>
            </div>
          )}
        </Container>
      </section>
    </div>
  )
}