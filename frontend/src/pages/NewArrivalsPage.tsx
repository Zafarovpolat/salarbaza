import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { productService } from '@/services/productService'
import { Product } from '@/types'
import { Container } from '@/components/layout/Container'
import { ProductGrid } from '@/components/product/ProductGrid'

export function NewArrivalsPage() {
  const navigate = useNavigate()
  const { language } = useLanguageStore()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        setIsLoading(true)
        const data = await productService.getNewProducts(50)
        setProducts(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [])

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 to-warning mx-4 mt-3 rounded-3xl p-7 text-white relative overflow-hidden">
        <div className="absolute -right-5 -top-5 text-[80px] opacity-[0.12] rotate-12">✨</div>
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium opacity-80">
            {language === 'uz' ? 'Yangiliklar' : 'Новинки'}
          </span>
        </div>
        <h1 className="font-display text-2xl font-medium">
          {language === 'uz' ? 'Barcha yangi mahsulotlar' : 'Все новинки'}
        </h1>
        <p className="text-white/70 text-sm mt-1">
          {products.length} {language === 'uz' ? 'ta mahsulot' : 'товаров'}
        </p>
      </div>

      <section className="py-6">
        <Container>
          <ProductGrid products={products} isLoading={isLoading} />

          {!isLoading && products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">✨</div>
              <p className="text-gray-500">
                {language === 'uz' ? 'Hozircha yangiliklar yo\'q' : 'Пока нет новинок'}
              </p>
            </div>
          )}
        </Container>
      </section>
    </div>
  )
}