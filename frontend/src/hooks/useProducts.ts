// frontend/src/hooks/useProducts.ts
import { useState, useEffect, useCallback } from 'react'
import { Product, ProductFilters, PaginatedResponse } from '@/types'
import { productService } from '@/services/productService'

interface UseProductsOptions {
    categorySlug?: string
    filters?: ProductFilters
    initialPage?: number
    limit?: number
}

export function useProducts(options: UseProductsOptions = {}) {
    const { categorySlug, filters, initialPage = 1, limit = 20 } = options

    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(initialPage)
    const [hasMore, setHasMore] = useState(true)
    const [total, setTotal] = useState(0)

    const fetchProducts = useCallback(async (pageNum: number, append = false) => {
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

            if (append) {
                setProducts(prev => [...prev, ...response.data])
            } else {
                setProducts(response.data)
            }

            setTotal(response.pagination.total)
            setHasMore(pageNum < response.pagination.totalPages)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch products')
        } finally {
            setIsLoading(false)
        }
    }, [categorySlug, filters?.sortBy, filters?.minPrice, filters?.maxPrice, filters?.inStock, filters?.search, limit])

    // Initial fetch and refetch when filters change
    useEffect(() => {
        setPage(1)
        setProducts([])
        fetchProducts(1, false)
    }, [fetchProducts])

    // Load more
    const loadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            const nextPage = page + 1
            setPage(nextPage)
            fetchProducts(nextPage, true)
        }
    }, [isLoading, hasMore, page, fetchProducts])

    // Refresh
    const refresh = useCallback(() => {
        setPage(1)
        setProducts([])
        fetchProducts(1, false)
    }, [fetchProducts])

    return {
        products,
        isLoading,
        error,
        hasMore,
        total,
        loadMore,
        refresh,
    }
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

        if (slug) {
            fetchProduct()
        }
    }, [slug])

    return { product, isLoading, error }
}