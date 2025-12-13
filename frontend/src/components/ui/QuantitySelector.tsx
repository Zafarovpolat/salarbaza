import { Minus, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/helpers'

interface QuantitySelectorProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    size?: 'sm' | 'md'
    disabled?: boolean
}

export function QuantitySelector({
    value,
    onChange,
    min = 1,
    max = 99,
    size = 'md',
    disabled = false,
}: QuantitySelectorProps) {
    const handleDecrease = () => {
        if (value > min) {
            onChange(value - 1)
        }
    }

    const handleIncrease = () => {
        if (value < max) {
            onChange(value + 1)
        }
    }

    const sizes = {
        sm: {
            button: 'w-7 h-7',
            icon: 'w-3.5 h-3.5',
            text: 'text-sm w-8',
        },
        md: {
            button: 'w-9 h-9',
            icon: 'w-4 h-4',
            text: 'text-base w-10',
        },
    }

    return (
        <div className="flex items-center gap-1">
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleDecrease}
                disabled={disabled || value <= min}
                className={cn(
                    'flex items-center justify-center rounded-full',
                    'bg-gray-100 text-gray-600',
                    'hover:bg-gray-200 active:bg-gray-300',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors',
                    sizes[size].button
                )}
            >
                <Minus className={sizes[size].icon} />
            </motion.button>

            <span className={cn(
                'font-medium text-gray-900 text-center',
                sizes[size].text
            )}>
                {value}
            </span>

            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleIncrease}
                disabled={disabled || value >= max}
                className={cn(
                    'flex items-center justify-center rounded-full',
                    'bg-primary-500 text-white',
                    'hover:bg-primary-600 active:bg-primary-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors',
                    sizes[size].button
                )}
            >
                <Plus className={sizes[size].icon} />
            </motion.button>
        </div>
    )
}