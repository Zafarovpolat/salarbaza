import { useEffect, useRef, useCallback } from 'react'

interface UseInfiniteScrollOptions {
    onLoadMore: () => void
    hasMore: boolean
    isLoading: boolean
    threshold?: number
}

export function useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading,
    threshold = 200,
}: UseInfiniteScrollOptions) {
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadMoreRef = useRef<HTMLDivElement | null>(null)

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [target] = entries
            if (target.isIntersecting && hasMore && !isLoading) {
                onLoadMore()
            }
        },
        [hasMore, isLoading, onLoadMore]
    )

    useEffect(() => {
        const element = loadMoreRef.current
        if (!element) return

        observerRef.current = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: `${threshold}px`,
            threshold: 0,
        })

        observerRef.current.observe(element)

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [handleObserver, threshold])

    return { loadMoreRef }
}