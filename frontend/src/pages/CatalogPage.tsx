import { useState } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { CategoryList } from '@/components/category/CategoryList'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ProductFilters } from '@/types'
import { cn } from '@/utils/helpers'

const sortOptions = [
  { value: 'newest',     labelUz: 'Yangi',    labelRu: 'Новые' },
  { value: 'price_asc',  labelUz: 'Arzon',    labelRu: 'Дешевле' },
  { value: 'price_desc', labelUz: 'Qimmat',   labelRu: 'Дороже' },
  { value: 'popular',    labelUz: 'Mashhur',   labelRu: 'Популярные' },
] as const

export function CatalogPage() {
  const { language } = useLanguageStore()
  const { categories, isLoading: categoriesLoading } = useCategories()

  const [filters, setFilters] = useState<ProductFilters>({ sortBy: 'newest' })
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  const { products, isLoading, hasMore, loadMore, total } = useProducts({ filters })
  const { loadMoreRef } = useInfiniteScroll({ onLoadMore: loadMore, hasMore, isLoading })

  return (
    <div className="pb-2">
      {/* Categories */}
      <section className="py-4 bg-ivory border-b border-stone/30">
        <Container>
          <CategoryList categories={categories} isLoading={categoriesLoading} variant="scroll" />
        </Container>
      </section>

      {/* Sort & Filter */}
      <section className="py-3 bg-cream/95 backdrop-blur-[20px] border-b border-stone/30 sticky top-16 z-20">
        <Container>
          <div className="flex items-center gap-2">
            {/* Sort pills */}
            <div className="flex-1 overflow-hidden">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilters(prev => ({ ...prev, sortBy: option.value }))}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 flex-shrink-0',
                      filters.sortBy === option.value
                        ? 'bg-forest text-white'
                        : 'bg-sand text-dark-gray hover:bg-stone'
                    )}
                  >
                    {language === 'uz' ? option.labelUz : option.labelRu}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter button */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="
                w-10 h-10 rounded-full flex-shrink-0
                bg-sand text-dark-gray
                flex items-center justify-center
                hover:bg-stone
                transition-colors duration-300
              "
            >
              <SlidersHorizontal className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </Container>
      </section>

      {/* Count */}
      <section className="py-3">
        <Container>
          <p className="text-sm text-medium-gray">
            {total} {language === 'uz' ? 'ta mahsulot topildi' : 'товаров найдено'}
          </p>
        </Container>
      </section>

      {/* Grid */}
      <section className="pb-6">
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

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApply={(f) => { setFilters(f); setIsFilterModalOpen(false) }}
      />
    </div>
  )
}

function FilterModal({
  isOpen, onClose, filters, onApply,
}: {
  isOpen: boolean; onClose: () => void
  filters: ProductFilters; onApply: (f: ProductFilters) => void
}) {
  const { language } = useLanguageStore()
  const [local, setLocal] = useState(filters)

  const priceRanges = [
    { min: 0, max: 200000, label: language === 'uz' ? '200 000 gacha' : 'До 200 000' },
    { min: 200000, max: 500000, label: '200 000 - 500 000' },
    { min: 500000, max: 1000000, label: '500 000 - 1 000 000' },
    { min: 1000000, max: undefined, label: language === 'uz' ? '1 000 000 dan' : 'От 1 000 000' },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'uz' ? 'Filtrlar' : 'Фильтры'}
    >
      <div className="p-5 space-y-6">
        {/* Price */}
        <div>
          <h3 className="font-display text-base font-medium text-charcoal mb-3">
            {language === 'uz' ? 'Narx' : 'Цена'}
          </h3>
          <div className="space-y-2">
            {priceRanges.map((range, i) => (
              <label
                key={i}
                className={cn(
                  'flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all duration-300',
                  local.minPrice === range.min && local.maxPrice === range.max
                    ? 'bg-forest/5 border-2 border-forest'
                    : 'bg-ivory border-2 border-transparent hover:bg-sand'
                )}
              >
                <input
                  type="radio"
                  name="priceRange"
                  checked={local.minPrice === range.min && local.maxPrice === range.max}
                  onChange={() => setLocal(prev => ({ ...prev, minPrice: range.min, maxPrice: range.max }))}
                  className="w-4 h-4 accent-forest"
                />
                <span className="text-dark-gray font-medium text-sm">{range.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* In Stock */}
        <label className={cn(
          'flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all duration-300',
          local.inStock ? 'bg-forest/5 border-2 border-forest' : 'bg-ivory border-2 border-transparent hover:bg-sand'
        )}>
          <input
            type="checkbox"
            checked={local.inStock === true}
            onChange={(e) => setLocal(prev => ({ ...prev, inStock: e.target.checked ? true : undefined }))}
            className="w-4 h-4 accent-forest rounded"
          />
          <span className="text-dark-gray font-medium text-sm">
            {language === 'uz' ? 'Faqat mavjud' : 'Только в наличии'}
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="ghost" fullWidth onClick={() => setLocal({ sortBy: 'newest' })}>
            {language === 'uz' ? 'Tozalash' : 'Сбросить'}
          </Button>
          <Button variant="green" fullWidth onClick={() => onApply(local)}>
            {language === 'uz' ? "Qo'llash" : 'Применить'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}