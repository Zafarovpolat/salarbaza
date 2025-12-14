import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Clock, TrendingUp } from 'lucide-react'
import { Product } from '@/types'
import { useLanguageStore } from '@/store/languageStore'
import { useDebounce } from '@/hooks/useDebounce'
import { productService } from '@/services/productService'
import { Container } from '@/components/layout/Container'
import { Input } from '@/components/ui/Input'
import { ProductGrid } from '@/components/product/ProductGrid'
import { EmptyState } from '@/components/ui/EmptyState'

const RECENT_SEARCHES_KEY = 'dekorhouse-recent-searches'
const MAX_RECENT_SEARCHES = 5

export function SearchPage() {
    const navigate = useNavigate()
    const { language } = useLanguageStore()

    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [recentSearches, setRecentSearches] = useState<string[]>([])

    const debouncedQuery = useDebounce(query, 300)

    // Load recent searches
    useEffect(() => {
        const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
        if (saved) {
            setRecentSearches(JSON.parse(saved))
        }
    }, [])

    // Search effect
    useEffect(() => {
        async function search() {
            if (!debouncedQuery.trim()) {
                setResults([])
                return
            }

            try {
                setIsLoading(true)
                const data = await productService.searchProducts(debouncedQuery)
                setResults(data)
            } catch (error) {
                console.error('Search failed:', error)
            } finally {
                setIsLoading(false)
            }
        }

        search()
    }, [debouncedQuery])

    const saveRecentSearch = useCallback((term: string) => {
        const updated = [term, ...recentSearches.filter(s => s !== term)]
            .slice(0, MAX_RECENT_SEARCHES)
        setRecentSearches(updated)
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
    }, [recentSearches])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            saveRecentSearch(query.trim())
        }
    }

    const handleRecentClick = (term: string) => {
        setQuery(term)
        saveRecentSearch(term)
    }

    const clearRecentSearches = () => {
        setRecentSearches([])
        localStorage.removeItem(RECENT_SEARCHES_KEY)
    }

    const popularSearches = [
        language === 'uz' ? 'Guldon' : 'Горшки',
        language === 'uz' ? 'Plastik' : 'Пластик',
        language === 'uz' ? 'Metall' : 'Металл',
        'Florence',
        'Botanik',
    ]

    return (
        <div className="pb-6">
            {/* Search Input */}
            <section className="sticky top-14 z-20 bg-white py-3 border-b border-gray-100">
                <Container>
                    <form onSubmit={handleSubmit}>
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={language === 'uz' ? 'Qidirish...' : 'Поиск...'}
                            isSearch
                            onClear={() => setQuery('')}
                            autoFocus
                        />
                    </form>
                </Container>
            </section>

            {/* Content */}
            <Container className="py-4">
                <AnimatePresence mode="wait">
                    {query.trim() ? (
                        // Search Results
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {isLoading ? (
                                <ProductGrid products={[]} isLoading={true} />
                            ) : results.length > 0 ? (
                                <>
                                    <p className="text-sm text-gray-500 mb-4">
                                        {results.length} {language === 'uz' ? 'ta natija' : 'результатов'}
                                    </p>
                                    <ProductGrid products={results} />
                                </>
                            ) : (
                                <EmptyState
                                    icon={Search}
                                    title={language === 'uz' ? 'Hech narsa topilmadi' : 'Ничего не найдено'}
                                    description={language === 'uz'
                                        ? 'Boshqa so\'z bilan qidirib ko\'ring'
                                        : 'Попробуйте другой запрос'}
                                />
                            )}
                        </motion.div>
                    ) : (
                        // Recent & Popular Searches
                        <motion.div
                            key="suggestions"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Recent Searches */}
                            {recentSearches.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Clock className="w-4 h-4" />
                                            <span className="font-medium">
                                                {language === 'uz' ? 'Oxirgi qidiruvlar' : 'Недавние'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={clearRecentSearches}
                                            className="text-sm text-gray-400 hover:text-gray-600"
                                        >
                                            {language === 'uz' ? 'Tozalash' : 'Очистить'}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {recentSearches.map((term, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleRecentClick(term)}
                                                className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700
                                 hover:bg-gray-200 transition-colors"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Popular Searches */}
                            <div>
                                <div className="flex items-center gap-2 text-gray-700 mb-3">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="font-medium">
                                        {language === 'uz' ? 'Mashhur' : 'Популярное'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {popularSearches.map((term, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleRecentClick(term)}
                                            className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm
                               hover:bg-primary-100 transition-colors"
                                        >
                                            {term}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Container>
        </div>
    )
}