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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {label}
                    </label>
                )}

                <div className="relative">
                    {/* Left Icon */}
                    {(leftIcon || isSearch) && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {isSearch ? <Search className="w-5 h-5" /> : leftIcon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        type={inputType}
                        className={cn(
                            'w-full bg-gray-100 border border-transparent rounded-xl',
                            'text-gray-900 placeholder-gray-400',
                            'focus:outline-none focus:border-primary-500 focus:bg-white',
                            'transition-all duration-200',
                            'py-3 px-4',
                            (leftIcon || isSearch) && 'pl-11',
                            (rightIcon || isPassword || onClear) && 'pr-11',
                            error && 'border-red-500 focus:border-red-500',
                            className
                        )}
                        {...props}
                    />

                    {/* Right Icon / Password Toggle / Clear */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isPassword ? (
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
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
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        ) : (
                            rightIcon && <span className="text-gray-400">{rightIcon}</span>
                        )}
                    </div>
                </div>

                {/* Error / Hint */}
                {(error || hint) && (
                    <p className={cn(
                        'mt-1.5 text-sm',
                        error ? 'text-red-500' : 'text-gray-500'
                    )}>
                        {error || hint}
                    </p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'