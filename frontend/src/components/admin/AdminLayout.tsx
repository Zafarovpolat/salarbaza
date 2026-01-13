import { ReactNode, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, FolderTree, ShoppingCart, LogOut, Home } from 'lucide-react'

interface AdminLayoutProps {
    children: ReactNode
}

const menuItems = [
    { path: '/admin/dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { path: '/admin/products', label: 'Товары', icon: Package },
    { path: '/admin/categories', label: 'Категории', icon: FolderTree },
    { path: '/admin/orders', label: 'Заказы', icon: ShoppingCart },
]

export function AdminLayout({ children }: AdminLayoutProps) {
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        const password = localStorage.getItem('adminPassword')
        if (!password) {
            navigate('/admin')
        }
    }, [navigate])

    const handleLogout = () => {
        localStorage.removeItem('adminPassword')
        navigate('/admin')
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-lg fixed h-full">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-gray-900">🏠 DekorHouse</h1>
                    <p className="text-sm text-gray-500">Админ-панель</p>
                </div>

                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                        ? 'bg-green-100 text-green-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="absolute bottom-0 w-64 p-4 border-t space-y-2">
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        На сайт
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors w-full"
                    >
                        <LogOut className="w-5 h-5" />
                        Выйти
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    )
}