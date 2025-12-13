import { cn } from '@/utils/helpers'

interface ContainerProps {
    children: React.ReactNode
    className?: string
}

export function Container({ children, className }: ContainerProps) {
    return (
        <div className={cn('container px-4 mx-auto max-w-lg', className)}>
            {children}
        </div>
    )
}