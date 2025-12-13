import { Check, Clock, Package, Truck, Home, X } from 'lucide-react'
import { OrderStatus as OrderStatusType } from '@/types'
import { useLanguageStore } from '@/store/languageStore'
import { cn } from '@/utils/helpers'

interface OrderStatusProps {
    status: OrderStatusType
    showSteps?: boolean
}

const statusConfig: Record<OrderStatusType, {
    icon: typeof Check
    colorClass: string
    step: number
}> = {
    PENDING: { icon: Clock, colorClass: 'text-yellow-500 bg-yellow-50', step: 0 },
    CONFIRMED: { icon: Check, colorClass: 'text-blue-500 bg-blue-50', step: 1 },
    PROCESSING: { icon: Package, colorClass: 'text-indigo-500 bg-indigo-50', step: 2 },
    SHIPPED: { icon: Truck, colorClass: 'text-purple-500 bg-purple-50', step: 3 },
    DELIVERED: { icon: Home, colorClass: 'text-green-500 bg-green-50', step: 4 },
    CANCELLED: { icon: X, colorClass: 'text-red-500 bg-red-50', step: -1 },
    RETURNED: { icon: X, colorClass: 'text-gray-500 bg-gray-50', step: -1 },
}

const steps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const

export function OrderStatusBadge({ status }: { status: OrderStatusType }) {
    const { t } = useLanguageStore()
    const config = statusConfig[status]
    const Icon = config.icon

    return (
        <div className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
            config.colorClass
        )}>
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">
                {t(`orders.status.${status.toLowerCase()}`)}
            </span>
        </div>
    )
}

export function OrderStatusStepper({ status }: OrderStatusProps) {
    const { t } = useLanguageStore()
    const currentStep = statusConfig[status].step

    if (currentStep < 0) {
        return <OrderStatusBadge status={status} />
    }

    return (
        <div className="space-y-4">
            {steps.map((step, index) => {
                const config = statusConfig[step]
                const Icon = config.icon
                const isCompleted = index <= currentStep
                const isCurrent = index === currentStep

                return (
                    <div key={step} className="flex items-center gap-3">
                        {/* Icon */}
                        <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                            isCompleted ? config.colorClass : 'bg-gray-100'
                        )}>
                            <Icon className={cn(
                                'w-5 h-5',
                                isCompleted ? '' : 'text-gray-400'
                            )} />
                        </div>

                        {/* Label */}
                        <div className="flex-1">
                            <div className={cn(
                                'font-medium',
                                isCompleted ? 'text-gray-900' : 'text-gray-400'
                            )}>
                                {t(`orders.status.${step.toLowerCase()}`)}
                            </div>
                            {isCurrent && (
                                <div className="text-sm text-primary-600">
                                    {t('common.loading')}
                                </div>
                            )}
                        </div>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div className={cn(
                                'absolute left-5 ml-[18px] w-0.5 h-full -translate-y-1/2',
                                index < currentStep ? 'bg-primary-500' : 'bg-gray-200'
                            )} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}