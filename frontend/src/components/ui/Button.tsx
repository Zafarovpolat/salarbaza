import { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'green' | 'addToCart'
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
      variant = 'green',
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
      // Белая кнопка (на зелёном фоне — hero, CTA)
      primary:
        'bg-white text-forest hover:shadow-button hover:-translate-y-0.5 active:translate-y-0',

      // Прозрачная с рамкой (hero secondary)
      secondary:
        'bg-transparent text-white border-[1.5px] border-white/40 hover:bg-white/15 hover:border-white/60',

      // Зелёная — основная рабочая кнопка
      green:
        'bg-forest text-white hover:bg-emerald hover:shadow-button-green hover:-translate-y-0.5 active:translate-y-0',

      // С рамкой (outline)
      outline:
        'border-2 border-forest text-forest hover:bg-forest/5 active:bg-forest/10',

      // Прозрачная
      ghost:
        'text-dark-gray hover:bg-sand active:bg-stone',

      // Красная (удалить, отменить)
      danger:
        'bg-error text-white hover:bg-error/90 active:bg-error/80',

      // Добавить в корзину
      addToCart:
        'bg-forest text-white w-full hover:bg-emerald hover:-translate-y-[1px] active:translate-y-0',
    }

    const sizes = {
      sm: 'px-4 py-2 text-xs rounded-xl gap-1.5',
      md: 'px-6 py-3 text-sm rounded-full gap-2',
      lg: 'px-8 py-4 text-sm rounded-full gap-2',
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center',
          'font-sans font-semibold',
          'uppercase tracking-[0.04em]',
          'transition-all duration-400 ease-smooth',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          // addToCart имеет свой radius
          variant === 'addToCart' && 'rounded-xl text-[13px] py-3 px-4 normal-case tracking-normal',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'