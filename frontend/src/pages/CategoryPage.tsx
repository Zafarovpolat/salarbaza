import { useParams } from 'react-router-dom'
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
    const {
        products,
        isLoading,
        hasMore,
        loadMore,
        total
    } = useProducts({ categorySlug: slug })

    const { loadMoreRef } = useInfiniteScroll({
        onLoadMore: loadMore,
        hasMore,
        isLoading,
    })

    const categoryName = category ? getCategoryName(category, language) : ''

    return (
        <div className="pb-6">
            {/* Category Header */}
            <section className="py-6 bg-white border-b border-gray-100">
                <Container>
                    {categoryLoading ? (
                        <div className="space-y-2">
                            <Skeleton height={28} className="w-48" />
                            <Skeleton height={16} className="w-32" />
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                {categoryName}
                            </h1>
                            <p className="text-gray-500">
                                {total} {language === 'uz' ? 'ta mahsulot' : 'товаров'}
                            </p>
                        </>
                    )}
                </Container>
            </section>

            {/* Products Grid */}
            <section className="py-6">
                <Container>
                    <ProductGrid
                        products={products}
                        isLoading={isLoading && products.length === 0}
                    />

                    {/* Load More */}
                    <div ref={loadMoreRef} className="h-20" />
                </Container>
            </section>
        </div>
    )
}