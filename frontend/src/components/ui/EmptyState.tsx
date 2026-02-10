import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* Icon container — gradient как в features */}
      <div className="
        w-20 h-20
        bg-gradient-to-br from-forest to-sage
        rounded-3xl
        flex items-center justify-center
        mb-5
      ">
        <Icon className="w-10 h-10 text-white" strokeWidth={1.5} />
      </div>

      <h3 className="font-display text-xl font-medium text-charcoal mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-medium-gray text-[15px] mb-8 max-w-xs leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <Button variant="green" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </motion.div>
  )
}