import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-[100dvh] h-screen bg-cream flex flex-col overflow-hidden">
      <Header />

      {/* ✅ FIX: main как скролл-контейнер с overscroll-contain */}
      <main
        className="flex-1 overflow-y-auto overscroll-y-contain pt-16 pb-[90px]"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
