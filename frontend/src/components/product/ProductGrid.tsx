import { Product } from '@/types'
import { ProductCard } from './ProductCard'
import { ProductCardSkeleton } from '../ui/Skeleton'

interface ProductGridProps {
    products: Product[]
    isLoading?: boolean
}

export function ProductGrid({
    products,
    isLoading = false,
}: ProductGridProps) {
    if (isLoading) {
        return (
            // 1 колонка до 400px, 2 колонки после
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                ))}
            </div>
        )
    }

    if (products.length === 0) {
        return null
    }

    return (
        // 1 колонка до 400px, 2 колонки после
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
            {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
            ))}
        </div>
    )
}