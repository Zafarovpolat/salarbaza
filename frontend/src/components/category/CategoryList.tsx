import { Category } from '@/types'
import { CategoryCard } from './CategoryCard'
import { CategoryCardSkeleton } from '../ui/Skeleton'

interface CategoryListProps {
    categories: Category[]
    isLoading?: boolean
    variant?: 'scroll' | 'grid'
}

export function CategoryList({
    categories,
    isLoading = false,
    variant = 'scroll',
}: CategoryListProps) {
    if (isLoading) {
        if (variant === 'scroll') {
            return (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <CategoryCardSkeleton key={i} />
                    ))}
                </div>
            )
        }

        return (
            <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-gray-200 animate-pulse rounded-2xl aspect-[4/3]" />
                ))}
            </div>
        )
    }

    if (variant === 'scroll') {
        return (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
                {categories.map((category, index) => (
                    <CategoryCard
                        key={category.id}
                        category={category}
                        index={index}
                        variant="circle"
                    />
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            {categories.map((category, index) => (
                <CategoryCard
                    key={category.id}
                    category={category}
                    index={index}
                    variant="card"
                />
            ))}
        </div>
    )
}