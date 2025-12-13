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
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
        >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Icon className="w-10 h-10 text-gray-400" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {title}
            </h3>

            {description && (
                <p className="text-gray-500 mb-6 max-w-xs">
                    {description}
                </p>
            )}

            {action && (
                <Button onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </motion.div>
    )
}