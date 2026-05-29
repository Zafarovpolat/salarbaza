import { useState, useEffect, useCallback, useRef } from 'react'
import { Product, ProductFilters } from '@/types'
import { productService } from '@/services/productService'
import { useScrollStore } from '@/store/scrollStore'

interface UseProductsOptions {
    categorySlug?: string
    filters?: ProductFilters
    initialPage?: number
    limit?: number
    /** A unique key for caching this list (e.g. "category:my-slug"). */
    cacheKey?: string
}

export function useProducts(options: UseProductsOptions = {}) {
    const { categorySlug, filters, initialPage = 1, limit = 20, cacheKey } = options

    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(initialPage)
    const [hasMore, setHasMore] = useState(true)
    const [total, setTotal] = useState(0)

    // ✅ Защита от лавины запросов
    const isRateLimited = useRef(false)
    const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isFetching = useRef(false)

    // ✅ Track whether we restored from cache to avoid refetch
    const restoredFromCache = useRef(false)

    const scrollStore = useScrollStore()

    const fetchProducts = useCallback(async (pageNum: number, append = false) => {
        // ✅ Не делать запрос если уже идёт или rate limited
        if (isFetching.current) return
        if (isRateLimited.current) return

        isFetching.current = true

        try {
            setIsLoading(true)
            setError(null)

            const response = await productService.getProducts({
                page: pageNum,
                limit,
                categorySlug,
                sortBy: filters?.sortBy,
                minPrice: filters?.minPrice,
                maxPrice: filters?.maxPrice,
                inStock: filters?.inStock,
                search: filters?.search,
            })

            isRateLimited.current = false

            if (append) {
                // ✅ Deduplicate: offset pagination can repeat items when
                // underlying data shifts between page loads (sync, stock changes)
                setProducts(prev => {
                    const existingIds = new Set(prev.map(p => (p as any).cardId || p.id))
                    const unique = response.data.filter(
                        (p: any) => !existingIds.has(p.cardId || p.id)
                    )
                    return [...prev, ...unique]
                })
            } else {
                setProducts(response.data)
            }

            setTotal(response.pagination.total)
            setHasMore(pageNum < response.pagination.totalPages)

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch products'

            if (message === 'TOO_MANY_REQUESTS') {
                // ✅ При 429 — стоп, ждём 30 секунд
                isRateLimited.current = true
                setHasMore(false)
                setError(null) // Не показываем ошибку пользователю

                retryTimer.current = setTimeout(() => {
                    isRateLimited.current = false
                    setHasMore(true)
                }, 30000)
            } else {
                setError(message)
            }
        } finally {
            setIsLoading(false)
            isFetching.current = false
        }
    }, [
        categorySlug,
        filters?.sortBy,
        filters?.minPrice,
        filters?.maxPrice,
        filters?.inStock,
        filters?.search,
        limit
    ])

    useEffect(() => {
        // ✅ Сброс при смене фильтров
        isRateLimited.current = false
        isFetching.current = false
        if (retryTimer.current) clearTimeout(retryTimer.current)

        // ✅ Try to restore from cache
        if (cacheKey) {
            const cached = scrollStore.get(cacheKey)
            if (cached) {
                setProducts(cached.products)
                setPage(cached.page)
                setHasMore(cached.hasMore)
                setTotal(cached.total)
                setIsLoading(false)
                restoredFromCache.current = true

                // Restore scroll position after render
                requestAnimationFrame(() => {
                    window.scrollTo(0, cached.scrollY)
                })
                return
            }
        }

        restoredFromCache.current = false
        setPage(1)
        setProducts([])
        setHasMore(true)
        fetchProducts(1, false)
    }, [fetchProducts]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        return () => {
            if (retryTimer.current) clearTimeout(retryTimer.current)
        }
    }, [])

    const loadMore = useCallback(() => {
        if (isLoading || !hasMore || isRateLimited.current || isFetching.current) return
        const nextPage = page + 1
        setPage(nextPage)
        fetchProducts(nextPage, true)
    }, [isLoading, hasMore, page, fetchProducts])

    const refresh = useCallback(() => {
        isRateLimited.current = false
        isFetching.current = false
        if (retryTimer.current) clearTimeout(retryTimer.current)
        restoredFromCache.current = false
        if (cacheKey) scrollStore.clear(cacheKey)
        setPage(1)
        setProducts([])
        setHasMore(true)
        fetchProducts(1, false)
    }, [fetchProducts, cacheKey]) // eslint-disable-line react-hooks/exhaustive-deps

    /** Save current state to cache — call before navigating away */
    const saveToCache = useCallback(() => {
        if (cacheKey && products.length > 0) {
            scrollStore.save(cacheKey, {
                products,
                page,
                hasMore,
                total,
                scrollY: window.scrollY,
            })
        }
    }, [cacheKey, products, page, hasMore, total]) // eslint-disable-line react-hooks/exhaustive-deps

    return { products, isLoading, error, hasMore, total, loadMore, refresh, saveToCache }
}

export function useProduct(slug: string) {
    const [product, setProduct] = useState<Product | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchProduct() {
            try {
                setIsLoading(true)
                setError(null)
                const data = await productService.getProductBySlug(slug)
                setProduct(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch product')
            } finally {
                setIsLoading(false)
            }
        }
        if (slug) fetchProduct()
    }, [slug])

    return { product, isLoading, error }
}
