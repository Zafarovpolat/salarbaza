import { cn } from '@/utils/helpers'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'forest' | 'sale' | 'success' | 'warning' | 'danger' | 'outline' | 'new'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  const variants = {
    default:  'bg-sand text-dark-gray',
    forest:   'bg-forest text-white',
    sale:     'bg-terracotta text-white',
    new:      'bg-forest text-white',
    success:  'bg-success/15 text-success',
    warning:  'bg-warning/15 text-warning',
    danger:   'bg-error/15 text-error',
    outline:  'bg-white/15 backdrop-blur-[10px] border border-white/20 text-white',
  }

  const sizes = {
    sm: 'px-2.5 py-1 text-[10px] tracking-[0.08em]',
    md: 'px-3 py-1.5 text-[11px] tracking-[0.05em]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'font-sans font-bold uppercase',
        'rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}