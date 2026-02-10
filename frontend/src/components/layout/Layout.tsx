import { Header } from './Header'
import { BottomNav } from './BottomNav'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-cream flex flex-col">
      <Header />

      {/* pt-16 = header height, pb-[90px] = bottom nav + padding */}
      <main className="flex-1 pt-16 pb-[90px]">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}