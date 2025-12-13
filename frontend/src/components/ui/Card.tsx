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
            default: 'bg-white border border-gray-100 shadow-sm',
            elevated: 'bg-white shadow-lg',
            outlined: 'bg-white border-2 border-gray-200',
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
                whileHover={hoverable ? { y: -2, shadow: 'lg' } : undefined}
                whileTap={hoverable ? { scale: 0.98 } : undefined}
                className={cn(
                    'rounded-2xl transition-shadow duration-200',
                    variants[variant],
                    paddings[padding],
                    hoverable && 'cursor-pointer hover:shadow-md',
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