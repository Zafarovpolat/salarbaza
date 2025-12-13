// frontend/src/components/layout/Layout.tsx
import { Header } from './Header'
import { BottomNav } from './BottomNav'

interface LayoutProps {
    children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1">
                {children}
            </main>

            <BottomNav />
        </div>
    )
}