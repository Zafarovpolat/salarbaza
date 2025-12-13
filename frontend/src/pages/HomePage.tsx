import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Sparkles, TrendingUp } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { useCategories } from '@/hooks/useCategories'
import { productService } from '@/services/productService'
import { Product } from '@/types'
import { CategoryList } from '@/components/category/CategoryList'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Container } from '@/components/layout/Container'

export function HomePage() {
    const navigate = useNavigate()
    const { t, language } = useLanguageStore()
    const { categories, isLoading: categoriesLoading } = useCategories()

    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
    const [newProducts, setNewProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchProducts() {
            try {
                setIsLoading(true)
                const [featured, newOnes] = await Promise.all([
                    productService.getFeaturedProducts(6),
                    productService.getNewProducts(6),
                ])
                setFeaturedProducts(featured)
                setNewProducts(newOnes)
            } catch (error) {
                console.error('Failed to fetch products:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProducts()
    }, [])

    return (
        <div className="pb-14">
            {/* Hero Banner */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-gradient-to-br from-primary-500 to-primary-700 text-white"
            >
                <Container className="py-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold font-display">
                                {language === 'uz'
                                    ? "Uyingiz uchun dekor"
                                    : "Декор для вашего дома"}
                            </h1>
                            <p className="text-primary-100 text-sm">
                                {language === 'uz'
                                    ? "Eng yaxshi narxlarda sifatli mahsulotlar"
                                    : "Качественные товары по лучшим ценам"}
                            </p>
                        </div>
                        <div className="text-6xl">🪴</div>
                    </div>
                </Container>

                {/* Wave decoration */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 40" fill="none" className="w-full">
                        <path
                            d="M0 40h1440V20c-120 10-240 15-360 15s-240-5-360-15-240-15-360-15-240 5-360 15v20z"
                            fill="#f9fafb"
                        />
                    </svg>
                </div>
            </motion.section>

            {/* Categories */}
            <section className="py-6">
                <Container>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {t('home.categories')}
                        </h2>
                        <button
                            onClick={() => navigate('/catalog')}
                            className="text-sm text-primary-600 font-medium flex items-center gap-1"
                        >
                            {t('home.viewAll')}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <CategoryList
                        categories={categories}
                        isLoading={categoriesLoading}
                        variant="scroll"
                    />
                </Container>
            </section>

            {/* Featured Products */}
            <section className="py-6">
                <Container>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary-500" />
                            <h2 className="text-lg font-semibold text-gray-900">
                                {t('home.featured')}
                            </h2>
                        </div>
                        <button
                            onClick={() => navigate('/catalog?featured=true')}
                            className="text-sm text-primary-600 font-medium flex items-center gap-1"
                        >
                            {t('home.viewAll')}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <ProductGrid
                        products={featuredProducts}
                        isLoading={isLoading}
                    />
                </Container>
            </section>

            {/* New Products */}
            <section className="py-6">
                <Container>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-yellow-500" />
                            <h2 className="text-lg font-semibold text-gray-900">
                                {t('home.new')}
                            </h2>
                        </div>
                        <button
                            onClick={() => navigate('/catalog?new=true')}
                            className="text-sm text-primary-600 font-medium flex items-center gap-1"
                        >
                            {t('home.viewAll')}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <ProductGrid
                        products={newProducts}
                        isLoading={isLoading}
                    />
                </Container>
            </section>

            {/* Promo Banner */}
            <section className="py-6">
                <Container>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/catalog')}
                        className="bg-gradient-to-r from-secondary-100 to-secondary-200 
                     rounded-2xl p-6 cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg mb-1">
                                    {language === 'uz'
                                        ? "Barcha mahsulotlar"
                                        : "Все товары"}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    {language === 'uz'
                                        ? "170+ turdagi dekoratsiyalar"
                                        : "170+ видов декора"}
                                </p>
                            </div>
                            <div className="bg-white rounded-full p-3 shadow-md">
                                <ChevronRight className="w-6 h-6 text-primary-600" />
                            </div>
                        </div>
                    </motion.div>
                </Container>
            </section>
        </div>
    )
}