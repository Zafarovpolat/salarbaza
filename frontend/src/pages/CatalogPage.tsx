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
    { value: 'newest', labelUz: 'Yangi', labelRu: 'Новые' },
    { value: 'price_asc', labelUz: 'Arzon', labelRu: 'Дешевле' },
    { value: 'price_desc', labelUz: 'Qimmat', labelRu: 'Дороже' },
    { value: 'popular', labelUz: 'Mashhur', labelRu: 'Популярные' },
] as const

export function CatalogPage() {
    const { language } = useLanguageStore()
    const { categories, isLoading: categoriesLoading } = useCategories()

    const [filters, setFilters] = useState<ProductFilters>({
        sortBy: 'newest',
    })
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

    const {
        products,
        isLoading,
        hasMore,
        loadMore,
        total
    } = useProducts({ filters })

    const { loadMoreRef } = useInfiniteScroll({
        onLoadMore: loadMore,
        hasMore,
        isLoading,
    })

    return (
        <div className="pb-2">
            {/* Categories */}
            <section className="py-4 bg-white border-b border-gray-100">
                <Container>
                    <CategoryList
                        categories={categories}
                        isLoading={categoriesLoading}
                        variant="scroll"
                    />
                </Container>
            </section>

            {/* Filters & Sort - ИСПРАВЛЕНО */}
            <section className="py-3 bg-white border-b border-gray-100 sticky top-14 z-20">
                <Container>
                    <div className="flex items-center gap-2">
                        {/* Sort Tabs - скроллящийся контейнер */}
                        <div className="flex-1 overflow-hidden">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {sortOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setFilters(prev => ({ ...prev, sortBy: option.value }))}
                                        className={cn(
                                            'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0',
                                            filters.sortBy === option.value
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        )}
                                    >
                                        {language === 'uz' ? option.labelUz : option.labelRu}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Filter Button - всегда видна, не перекрывает */}
                        <button
                            onClick={() => setIsFilterModalOpen(true)}
                            className="flex items-center justify-center w-10 h-10 rounded-full 
                       bg-gray-100 text-gray-600 hover:bg-gray-200 
                       transition-colors flex-shrink-0"
                        >
                            <SlidersHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </Container>
            </section>

            {/* Products Count */}
            <section className="py-3">
                <Container>
                    <p className="text-sm text-gray-500">
                        {total} {language === 'uz' ? 'ta mahsulot topildi' : 'товаров найдено'}
                    </p>
                </Container>
            </section>

            {/* Products Grid */}
            <section className="pb-6">
                <Container>
                    <ProductGrid products={products} isLoading={isLoading && products.length === 0} />

                    {/* Load More Trigger */}
                    <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                        {isLoading && products.length > 0 && (
                            <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                        className="w-2 h-2 bg-primary-500 rounded-full"
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
                onApply={(newFilters) => {
                    setFilters(newFilters)
                    setIsFilterModalOpen(false)
                }}
            />
        </div>
    )
}

function FilterModal({
    isOpen,
    onClose,
    filters,
    onApply,
}: {
    isOpen: boolean
    onClose: () => void
    filters: ProductFilters
    onApply: (filters: ProductFilters) => void
}) {
    const { language } = useLanguageStore()
    const [localFilters, setLocalFilters] = useState(filters)

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
            <div className="p-4 space-y-6">
                {/* Price Range */}
                <div>
                    <h3 className="font-medium text-gray-900 mb-3">
                        {language === 'uz' ? 'Narx' : 'Цена'}
                    </h3>
                    <div className="space-y-2">
                        {priceRanges.map((range, index) => (
                            <label
                                key={index}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer
                         hover:bg-gray-100 transition-colors"
                            >
                                <input
                                    type="radio"
                                    name="priceRange"
                                    checked={
                                        localFilters.minPrice === range.min &&
                                        localFilters.maxPrice === range.max
                                    }
                                    onChange={() => setLocalFilters(prev => ({
                                        ...prev,
                                        minPrice: range.min,
                                        maxPrice: range.max,
                                    }))}
                                    className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                                />
                                <span className="text-gray-700">{range.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* In Stock Only */}
                <div>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                        <input
                            type="checkbox"
                            checked={localFilters.inStock === true}
                            onChange={(e) => setLocalFilters(prev => ({
                                ...prev,
                                inStock: e.target.checked ? true : undefined,
                            }))}
                            className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-700">
                            {language === 'uz' ? 'Faqat mavjud' : 'Только в наличии'}
                        </span>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => {
                            setLocalFilters({ sortBy: 'newest' })
                        }}
                    >
                        {language === 'uz' ? 'Tozalash' : 'Сбросить'}
                    </Button>
                    <Button
                        fullWidth
                        onClick={() => onApply(localFilters)}
                    >
                        {language === 'uz' ? "Qo'llash" : 'Применить'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}