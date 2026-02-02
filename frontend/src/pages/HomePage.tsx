import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Sparkles, TrendingUp, Percent, Timer } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { useCategories } from '@/hooks/useCategories'
import { productService } from '@/services/productService'
import { Product } from '@/types'
import { CategoryList } from '@/components/category/CategoryList'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Container } from '@/components/layout/Container'
import { getProductName } from '@/utils/helpers'

export function HomePage() {
    const navigate = useNavigate()
    const { t, language } = useLanguageStore()
    const { categories, isLoading: categoriesLoading } = useCategories()

    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
    const [newProducts, setNewProducts] = useState<Product[]>([])
    const [saleProducts, setSaleProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchProducts() {
            try {
                setIsLoading(true)
                const [featured, newOnes, sale] = await Promise.all([
                    productService.getFeaturedProducts(6),
                    productService.getNewProducts(6),
                    productService.getSaleProducts(8),
                ])
                setFeaturedProducts(featured)
                setNewProducts(newOnes)
                setSaleProducts(sale)
            } catch (error) {
                console.error('Failed to fetch products:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProducts()
    }, [])

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ru-RU').format(price)
    }

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

            {/* 🔥 Sale Products - Спецпредложения */}
            {saleProducts.length > 0 && (
                <section className="py-6">
                    <Container>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                                    <Percent className="w-4 h-4 text-red-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {language === 'uz' ? 'Maxsus takliflar' : 'Спецпредложения'}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        {/* Sale Banner */}
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-4 mb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Timer className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-lg">
                                            {language === 'uz' ? 'Chegirmalar!' : 'Скидки!'}
                                        </p>
                                        <p className="text-white/80 text-sm">
                                            {language === 'uz'
                                                ? `${saleProducts.length} ta mahsulot`
                                                : `${saleProducts.length} товаров`}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-3xl">🎁</div>
                            </div>
                        </div>

                        {/* Products Carousel */}
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {saleProducts.map((product, index) => {
                                const name = getProductName(product, language)
                                const image = product.images?.[0]?.url
                                const discount = product.oldPrice
                                    ? Math.round((1 - product.price / product.oldPrice) * 100)
                                    : 0

                                return (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link
                                            to={`/product/${product.slug}`}
                                            className="flex-shrink-0 w-40 block group"
                                        >
                                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                                                {/* Image */}
                                                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                                                    {image ? (
                                                        <img
                                                            src={image}
                                                            alt={name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-3xl text-gray-200">
                                                            🌿
                                                        </div>
                                                    )}

                                                    {/* Discount Badge */}
                                                    <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">
                                                        -{discount}%
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div className="p-3">
                                                    <h4 className="text-sm text-gray-900 line-clamp-2 leading-tight min-h-[2.25rem]">
                                                        {name}
                                                    </h4>
                                                    <div className="mt-2">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-base font-bold text-green-600">
                                                                {formatPrice(product.price)}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {language === 'uz' ? 'soʻm' : 'сўм'}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-400 line-through">
                                                            {formatPrice(product.oldPrice!)} {language === 'uz' ? 'soʻm' : 'сўм'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </Container>
                </section>
            )}

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