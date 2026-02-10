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
  bgClass: string
  textClass: string
  step: number
}> = {
  PENDING:    { icon: Clock,   bgClass: 'bg-warning/15', textClass: 'text-warning',    step: 0 },
  CONFIRMED:  { icon: Check,   bgClass: 'bg-sage/15',    textClass: 'text-sage',       step: 1 },
  PROCESSING: { icon: Package, bgClass: 'bg-emerald/15', textClass: 'text-emerald',    step: 2 },
  SHIPPED:    { icon: Truck,   bgClass: 'bg-forest/15',  textClass: 'text-forest',     step: 3 },
  DELIVERED:  { icon: Home,    bgClass: 'bg-success/15', textClass: 'text-success',    step: 4 },
  CANCELLED:  { icon: X,       bgClass: 'bg-error/15',   textClass: 'text-error',      step: -1 },
  RETURNED:   { icon: X,       bgClass: 'bg-taupe/20',   textClass: 'text-medium-gray', step: -1 },
}

const steps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const

export function OrderStatusBadge({ status }: { status: OrderStatusType }) {
  const { t } = useLanguageStore()
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full',
      config.bgClass, config.textClass
    )}>
      <Icon className="w-4 h-4" strokeWidth={1.5} />
      <span className="text-sm font-semibold">
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
              'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300',
              isCompleted
                ? `${config.bgClass} ${config.textClass}`
                : 'bg-sand text-taupe'
            )}>
              <Icon className="w-5 h-5" strokeWidth={1.5} />
            </div>

            {/* Label */}
            <div className="flex-1">
              <div className={cn(
                'font-medium text-sm transition-colors duration-300',
                isCompleted ? 'text-charcoal' : 'text-taupe'
              )}>
                {t(`orders.status.${step.toLowerCase()}`)}
              </div>
              {isCurrent && (
                <div className="text-xs text-sage font-medium mt-0.5">
                  {t('common.loading')}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}