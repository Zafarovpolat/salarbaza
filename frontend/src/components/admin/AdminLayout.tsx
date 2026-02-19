import { ReactNode, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Package, FolderTree,
  ShoppingCart, LogOut, Home, Menu, X, Percent, Tag,
} from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
  title?: string  // 🆕 Опциональный заголовок
}

const menuItems = [
  { path: '/admin/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { path: '/admin/products', label: 'Товары', icon: Package },
  { path: '/admin/categories', label: 'Категории', icon: FolderTree },
  { path: '/admin/promotions', label: 'Акции', icon: Tag },          // 🆕
  { path: '/admin/wholesale', label: 'Оптовые цены', icon: Percent },
  { path: '/admin/orders', label: 'Заказы', icon: ShoppingCart },
  { path: '/admin/customers', label: 'Клиенты', icon: Users },
]

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const password = localStorage.getItem('adminPassword')
    if (!password) navigate('/admin')
  }, [navigate])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('adminPassword')
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-cream/92 backdrop-blur-[20px] border-b border-stone/50">
        <div className="flex items-center justify-between px-5 h-16">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-sand transition-colors duration-300"
          >
            <Menu className="w-6 h-6 text-dark-gray" />
          </button>
          <span className="font-display text-lg font-semibold text-forest">
            Decor<span className="text-sage font-normal">house</span>
          </span>
          <div className="w-10" />
        </div>
      </header>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 w-64
        bg-ivory border-r border-stone/30
        transform transition-transform duration-300 ease-smooth
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone/30">
          <div>
            <span className="font-display text-xl font-semibold text-forest">
              Decor<span className="text-sage font-normal">house</span>
            </span>
            <p className="text-xs text-medium-gray mt-0.5">Админ-панель</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-sand transition-colors duration-300"
          >
            <X className="w-5 h-5 text-dark-gray" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path))
            const Icon = item.icon

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-2xl
                  transition-all duration-300 font-medium text-sm
                  ${isActive
                    ? 'bg-forest text-white shadow-button-green'
                    : 'text-dark-gray hover:bg-sand'
                  }
                `}
              >
                <Icon className="w-5 h-5" strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-stone/30 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-dark-gray hover:bg-sand transition-all duration-300 font-medium text-sm"
          >
            <Home className="w-5 h-5" strokeWidth={1.5} />
            <span>На сайт</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-error hover:bg-error/10 transition-all duration-300 font-medium text-sm w-full"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {title && (
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              {title}
            </h1>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}