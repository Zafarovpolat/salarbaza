import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguageStore } from '@/store/languageStore'
import { useCategory } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Container } from '@/components/layout/Container'
import { Skeleton } from '@/components/ui/Skeleton'
import { getCategoryName } from '@/utils/helpers'

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const { language } = useLanguageStore()

  const { category, isLoading: categoryLoading } = useCategory(slug || '')
  const { products, isLoading, hasMore, loadMore, total } = useProducts({ categorySlug: slug })
  const { loadMoreRef } = useInfiniteScroll({ onLoadMore: loadMore, hasMore, isLoading })

  const categoryName = category ? getCategoryName(category, language) : ''

  return (
    <div className="pb-6">
      {/* Header */}
      <section className="py-8 bg-ivory border-b border-stone/30">
        <Container>
          {categoryLoading ? (
            <div className="space-y-2">
              <Skeleton height={32} className="w-48" />
              <Skeleton height={16} className="w-32" />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-display text-3xl font-medium text-charcoal mb-1">
                {categoryName}
              </h1>
              <p className="text-medium-gray text-sm">
                {total} {language === 'uz' ? 'ta mahsulot' : 'товаров'}
              </p>
            </motion.div>
          )}
        </Container>
      </section>

      {/* Grid */}
      <section className="py-6">
        <Container>
          <ProductGrid products={products} isLoading={isLoading && products.length === 0} />
          <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
            {isLoading && products.length > 0 && (
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="w-2 h-2 bg-forest rounded-full"
                  />
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>
    </div>
  )
}