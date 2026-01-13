import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'
import toast from 'react-hot-toast'

interface Product {
    id: string
    code: string
    nameRu: string
    price: number
    stockQuantity: number
    isActive: boolean
    category: { nameRu: string }
    images: { url: string }[]
}

export function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        try {
            const data = await adminService.getProducts()
            setProducts(data)
        } catch (error) {
            toast.error('Ошибка загрузки товаров')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Удалить товар "${name}"?`)) return

        try {
            await adminService.deleteProduct(id)
            toast.success('Товар удалён')
            loadProducts()
        } catch (error) {
            toast.error('Ошибка удаления')
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('uz-UZ').format(price)
    }

    const filteredProducts = products.filter(p =>
        p.nameRu.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Товары</h1>
                <Link
                    to="/admin/products/new"
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Добавить товар
                </Link>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по названию или коду..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Фото</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Код</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Название</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Категория</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Цена</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Остаток</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Статус</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                    Загрузка...
                                </td>
                            </tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                    Товары не найдены
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                            {product.images?.[0]?.url ? (
                                                <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">📷</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{product.code}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.nameRu}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{product.category?.nameRu}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{formatPrice(product.price)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{product.stockQuantity}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {product.isActive ? 'Активен' : 'Скрыт'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                to={`/admin/products/${product.id}`}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.id, product.nameRu)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    )
}