import { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils/helpers'

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hoverable = false,
      className,
      ...props
    },
    ref
  ) => {
    const variants = {
      default:  'bg-ivory border border-stone/30',
      elevated: 'bg-ivory shadow-card',
      outlined: 'bg-ivory border-2 border-stone',
    }

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    }

    return (
      <motion.div
        ref={ref}
        whileHover={hoverable ? { y: -4 } : undefined}
        whileTap={hoverable ? { scale: 0.98 } : undefined}
        className={cn(
          'rounded-2xl transition-all duration-400 ease-smooth',
          variants[variant],
          paddings[padding],
          hoverable && 'cursor-pointer hover:shadow-card',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'