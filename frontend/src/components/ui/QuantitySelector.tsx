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
    if (value > min) onChange(value - 1)
  }

  const handleIncrease = () => {
    if (value < max) onChange(value + 1)
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
    <div className="flex items-center gap-1.5">
      {/* Minus */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        className={cn(
          'flex items-center justify-center rounded-full',
          'bg-sand text-dark-gray',
          'hover:bg-stone active:bg-taupe',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-300',
          sizes[size].button
        )}
      >
        <Minus className={sizes[size].icon} strokeWidth={2} />
      </motion.button>

      {/* Value */}
      <span className={cn(
        'font-semibold text-charcoal text-center tabular-nums',
        sizes[size].text
      )}>
        {value}
      </span>

      {/* Plus */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleIncrease}
        disabled={disabled || value >= max}
        className={cn(
          'flex items-center justify-center rounded-full',
          'bg-forest text-white',
          'hover:bg-emerald',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-300',
          sizes[size].button
        )}
      >
        <Plus className={sizes[size].icon} strokeWidth={2} />
      </motion.button>
    </div>
  )
}