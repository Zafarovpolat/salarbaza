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
        <div className="flex gap-3.5 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[3/4] rounded-3xl" />
        ))}
      </div>
    )
  }

  // ===== HORIZONTAL SCROLL =====
  if (variant === 'scroll') {
    return (
      <div className="
        flex gap-3.5 overflow-x-auto
        scrollbar-hide
        pb-4 -mx-4 px-4
        snap-x snap-mandatory
      ">
        {categories.map((category, index) => (
          <div key={category.id} className="flex-none w-[160px] md:w-[200px] snap-start">
            <CategoryCard
              category={category}
              index={index}
              variant="card"
            />
          </div>
        ))}
      </div>
    )
  }

  // ===== GRID =====
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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