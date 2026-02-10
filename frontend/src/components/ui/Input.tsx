import { forwardRef, useState } from 'react'
import { Eye, EyeOff, Search, X } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  isSearch?: boolean
  onClear?: () => void
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      isSearch = false,
      onClear,
      type = 'text',
      className,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-charcoal mb-1.5">
            {label}
          </label>
        )}

        <div className="relative">
          {/* Left Icon */}
          {(leftIcon || isSearch) && (
            <div className="absolute left-[18px] top-1/2 -translate-y-1/2 text-taupe">
              {isSearch ? <Search className="w-5 h-5" strokeWidth={2} /> : leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full',
              'bg-sand border-2 border-transparent',
              'font-sans text-[15px] text-charcoal',
              'placeholder:text-taupe',
              'outline-none',
              'transition-all duration-300',
              // Фокус
              'focus:bg-white focus:border-forest',
              'focus:shadow-focus',
              // Размеры и скругление
              isSearch
                ? 'py-3.5 rounded-full'    // Поиск — полностью округлый
                : 'py-3 rounded-xl',       // Обычный — слегка округлый
              'px-4',
              (leftIcon || isSearch) && 'pl-12',
              (rightIcon || isPassword || onClear) && 'pr-12',
              // Ошибка
              error && 'border-error focus:border-error',
              className
            )}
            {...props}
          />

          {/* Right Icon / Password Toggle / Clear */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {isPassword ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-taupe hover:text-dark-gray transition-colors duration-300"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            ) : onClear && props.value ? (
              <button
                type="button"
                onClick={onClear}
                className="text-taupe hover:text-dark-gray transition-colors duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              rightIcon && <span className="text-taupe">{rightIcon}</span>
            )}
          </div>
        </div>

        {/* Error / Hint */}
        {(error || hint) && (
          <p className={cn(
            'mt-1.5 text-sm',
            error ? 'text-error' : 'text-medium-gray'
          )}>
            {error || hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'