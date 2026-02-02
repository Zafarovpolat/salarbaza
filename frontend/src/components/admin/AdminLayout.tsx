import { ReactNode, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    Package,
    FolderTree,
    ShoppingCart,
    LogOut,
    Home,
    Menu,
    X,
    Percent  // ✅ Добавь иконку
} from 'lucide-react'

interface AdminLayoutProps {
    children: ReactNode
}

const menuItems = [
    { path: '/admin/dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { path: '/admin/products', label: 'Товары', icon: Package },
    { path: '/admin/categories', label: 'Категории', icon: FolderTree },
    { path: '/admin/wholesale', label: 'Оптовые цены', icon: Percent },  // ✅ Добавь
    { path: '/admin/orders', label: 'Заказы', icon: ShoppingCart },
    { path: '/admin/customers', label: 'Клиенты', icon: Users },  // ✅ Добавьте эту строку
]

export function AdminLayout({ children }: AdminLayoutProps) {
    const location = useLocation()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        const password = localStorage.getItem('adminPassword')
        if (!password) {
            navigate('/admin')
        }
    }, [navigate])

    useEffect(() => {
        setSidebarOpen(false)
    }, [location.pathname])

    const handleLogout = () => {
        localStorage.removeItem('adminPassword')
        navigate('/admin')
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
                <div className="flex items-center justify-between px-4 h-14">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <h1 className="font-bold text-gray-900">🏠 DekorHouse</h1>
                    <div className="w-10" />
                </div>
            </header>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-50"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-full bg-white shadow-lg z-50 w-64
                transform transition-transform duration-300 ease-in-out
                lg:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">🏠 DekorHouse</h1>
                        <p className="text-xs text-gray-500">Админ-панель</p>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                    ? 'bg-green-100 text-green-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t space-y-1">
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        <span className="font-medium">На сайт</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Выйти</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
                <div className="p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}