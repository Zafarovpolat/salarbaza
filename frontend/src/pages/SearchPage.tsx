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

  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (saved) setRecentSearches(JSON.parse(saved))
  }, [])

  useEffect(() => {
    async function search() {
      if (!debouncedQuery.trim()) { setResults([]); return }
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
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, MAX_RECENT_SEARCHES)
    setRecentSearches(updated)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  }, [recentSearches])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) saveRecentSearch(query.trim())
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
    'Florence', 'Botanik',
  ]

  return (
    <div className="pb-6">
      {/* Search Input */}
      <section className="sticky top-16 z-20 bg-cream/95 backdrop-blur-[20px] py-3 border-b border-stone/30">
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

      <Container className="py-4">
        <AnimatePresence mode="wait">
          {query.trim() ? (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {isLoading ? (
                <ProductGrid products={[]} isLoading />
              ) : results.length > 0 ? (
                <>
                  <p className="text-sm text-medium-gray mb-4">
                    {results.length} {language === 'uz' ? 'ta natija' : 'результатов'}
                  </p>
                  <ProductGrid products={results} />
                </>
              ) : (
                <EmptyState
                  icon={Search}
                  title={language === 'uz' ? 'Hech narsa topilmadi' : 'Ничего не найдено'}
                  description={language === 'uz' ? "Boshqa so'z bilan qidirib ko'ring" : 'Попробуйте другой запрос'}
                />
              )}
            </motion.div>
          ) : (
            <motion.div key="suggestions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Recent */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-charcoal">
                      <Clock className="w-4 h-4" />
                      <span className="font-semibold text-sm">{language === 'uz' ? 'Oxirgi qidiruvlar' : 'Недавние'}</span>
                    </div>
                    <button onClick={clearRecentSearches} className="text-sm text-taupe hover:text-dark-gray transition-colors">
                      {language === 'uz' ? 'Tozalash' : 'Очистить'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleRecentClick(term)}
                        className="px-4 py-2 bg-sand rounded-full text-sm text-dark-gray font-medium hover:bg-stone transition-colors duration-300"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular */}
              <div>
                <div className="flex items-center gap-2 text-charcoal mb-3">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-semibold text-sm">{language === 'uz' ? 'Mashhur' : 'Популярное'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => handleRecentClick(term)}
                      className="px-4 py-2 bg-forest/8 text-forest rounded-full text-sm font-medium hover:bg-forest/15 transition-colors duration-300"
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