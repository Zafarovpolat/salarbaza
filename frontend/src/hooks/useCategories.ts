import { useState, useEffect } from 'react'
import { Category } from '@/types'
import { categoryService } from '@/services/categoryService'

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchCategories() {
            try {
                setIsLoading(true)
                const data = await categoryService.getCategories()
                setCategories(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch categories')
            } finally {
                setIsLoading(false)
            }
        }

        fetchCategories()
    }, [])

    return { categories, isLoading, error }
}

export function useCategory(slug: string) {
    const [category, setCategory] = useState<Category | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchCategory() {
            try {
                setIsLoading(true)
                const data = await categoryService.getCategoryBySlug(slug)
                setCategory(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch category')
            } finally {
                setIsLoading(false)
            }
        }

        if (slug) {
            fetchCategory()
        }
    }, [slug])

    return { category, isLoading, error }
}