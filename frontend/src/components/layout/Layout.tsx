import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="pt-16 pb-[90px]">{children}</main>
      <BottomNav />
    </div>
  );
}
