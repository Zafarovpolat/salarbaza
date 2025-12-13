import { cn } from '@/utils/helpers'

interface SkeletonProps {
    className?: string
    variant?: 'text' | 'circular' | 'rectangular'
    width?: string | number
    height?: string | number
    animation?: 'pulse' | 'shimmer' | 'none'
}

export function Skeleton({
    className,
    variant = 'rectangular',
    width,
    height,
    animation = 'pulse',
}: SkeletonProps) {
    const variants = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-xl',
    }

    const animations = {
        pulse: 'animate-pulse',
        shimmer: 'shimmer',
        none: '',
    }

    return (
        <div
            className={cn(
                'bg-gray-200',
                variants[variant],
                animations[animation],
                className
            )}
            style={{
                width: width,
                height: height,
            }}
        />
    )
}

// Product Card Skeleton
export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
            <Skeleton className="aspect-square w-full" />
            <div className="p-3 space-y-2">
                <Skeleton height={16} className="w-3/4" />
                <Skeleton height={14} className="w-1/2" />
                <div className="flex justify-between items-center pt-2">
                    <Skeleton height={20} className="w-24" />
                    <Skeleton height={36} width={36} variant="circular" />
                </div>
            </div>
        </div>
    )
}

// Category Card Skeleton
export function CategoryCardSkeleton() {
    return (
        <div className="flex flex-col items-center gap-2">
            <Skeleton height={72} width={72} variant="circular" />
            <Skeleton height={14} className="w-16" />
        </div>
    )
}