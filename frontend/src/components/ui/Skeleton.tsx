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
  animation = 'shimmer',
}: SkeletonProps) {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  }

  const animations = {
    pulse: 'animate-pulse bg-sand',
    shimmer: 'skeleton',  // uses the .skeleton class from index.css
    none: 'bg-sand',
  }

  return (
    <div
      className={cn(
        variants[variant],
        animations[animation],
        className
      )}
      style={{ width, height }}
    />
  )
}

// Product Card Skeleton — тёплые тона
export function ProductCardSkeleton() {
  return (
    <div className="bg-ivory rounded-2xl overflow-hidden">
      {/* Image area */}
      <div className="m-2.5">
        <Skeleton className="aspect-square w-full rounded-xl" />
      </div>
      {/* Content */}
      <div className="px-3.5 pb-4 pt-1 flex flex-col items-center gap-2">
        <Skeleton height={12} className="w-16" />
        <Skeleton height={16} className="w-3/4" />
        <Skeleton height={18} className="w-24" />
      </div>
    </div>
  )
}

// Category Card Skeleton
export function CategoryCardSkeleton() {
  return (
    <div className="flex-none w-[160px]">
      <Skeleton className="aspect-[3/4] w-full rounded-3xl" />
    </div>
  )
}