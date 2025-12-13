import { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface ButtonProps extends HTMLMotionProps<'button'> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    isLoading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            fullWidth = false,
            disabled,
            className,
            ...props
        },
        ref
    ) => {
        const variants = {
            primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
            secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300',
            outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 active:bg-primary-100',
            ghost: 'text-gray-600 hover:bg-gray-100 active:bg-gray-200',
            danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
        }

        const sizes = {
            sm: 'px-3 py-1.5 text-sm rounded-lg',
            md: 'px-4 py-2.5 text-base rounded-xl',
            lg: 'px-6 py-3 text-lg rounded-xl',
        }

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.97 }}
                disabled={disabled || isLoading}
                className={cn(
                    'inline-flex items-center justify-center font-medium',
                    'transition-colors duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    variants[variant],
                    sizes[size],
                    fullWidth && 'w-full',
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        {leftIcon && <span className="mr-2">{leftIcon}</span>}
                        {children}
                        {rightIcon && <span className="ml-2">{rightIcon}</span>}
                    </>
                )}
            </motion.button>
        )
    }
)

Button.displayName = 'Button'