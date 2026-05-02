// frontend/src/pages/admin/AdminProductsPage.tsx

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Search, Ruler, Package } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'
import toast from 'react-hot-toast'

interface ProductVariant {
    id: string
    size: string
    price: number
    inStock: boolean
}

interface WarehouseStock {
    warehouseId: string
    warehouseName: string
    sortOrder: number
    amount: number
    booked: number
    inTransit: number
    inTrash: number
}

interface Product {
    id: string
    code: string
    nameRu: string
    price: number
    stockQuantity: number
    isActive: boolean
    category: { nameRu: string }
    images: { url: string }[]
    variants?: ProductVariant[]
    warehouseStocks?: WarehouseStock[]
}

type StockStatus = 'all' | 'in' | 'out' | 'low'

function stockTier(qty: number): { color: string; bg: string; label: string } {
    if (qty <= 0) return { color: 'text-red-700', bg: 'bg-red-100', label: 'Нет' }
    if (qty < 5) return { color: 'text-orange-700', bg: 'bg-orange-100', label: 'Мало' }
    if (qty < 20) return { color: 'text-yellow-800', bg: 'bg-yellow-100', label: 'Низк.' }
    return { color: 'text-green-700', bg: 'bg-green-100', label: 'OK' }
}

function formatNumber(n: number): string {
    return new Intl.NumberFormat('ru-RU').format(n)
}

function warehouseSummary(stocks?: WarehouseStock[]): string {
    if (!stocks || stocks.length === 0) return ''
    return stocks
        .filter(s => s.amount > 0)
        .map(s => `${s.warehouseName}: ${formatNumber(s.amount)}`)
        .join(' • ')
}

export function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [stockStatus, setStockStatus] = useState<StockStatus>('all')

    useEffect(() => { loadProducts() }, [stockStatus])

    const loadProducts = async () => {
        setLoading(true)
        try {
            const data = await adminService.getProducts({ stockStatus })
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
        } catch (error) { toast.error('Ошибка удаления') }
    }

    const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price)

    const filteredProducts = products.filter(p =>
        p.nameRu.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
    )

    // ✅ Получить отображение цены
    const getPriceDisplay = (product: Product) => {
        if (product.variants && product.variants.length > 0) {
            const prices = product.variants.map(v => v.price)
            const min = Math.min(...prices)
            const max = Math.max(...prices)
            if (min === max) return formatPrice(min)
            return `${formatPrice(min)} — ${formatPrice(max)}`
        }
        return formatPrice(product.price)
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Товары</h1>
                <Link to="/admin/products/new"
                    className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm font-medium">
                    <Plus className="w-5 h-5" /><span>Добавить</span>
                </Link>
            </div>

            {/* Search + stock filter */}
            <div className="bg-white rounded-xl p-3 mb-4 shadow-sm space-y-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">Остаток:</span>
                    {([
                        { value: 'all', label: 'Все' },
                        { value: 'in', label: 'В наличии' },
                        { value: 'low', label: 'Заканчивается (<5)' },
                        { value: 'out', label: 'Нет' },
                    ] as { value: StockStatus; label: string }[]).map(o => (
                        <button
                            key={o.value}
                            type="button"
                            onClick={() => setStockStatus(o.value)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${stockStatus === o.value ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 lg:hidden">
                {loading ? (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">Загрузка...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">Товары не найдены</div>
                ) : filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex gap-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {product.images?.[0]?.url ? (
                                    <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">📷</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{product.nameRu}</h3>
                                        <p className="text-xs text-gray-500">{product.code}</p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {/* ✅ Бейдж вариантов */}
                                        {product.variants && product.variants.length > 0 && (
                                            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-0.5">
                                                <Ruler className="w-3 h-3" />
                                                {product.variants.length}
                                            </span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {product.isActive ? 'Акт.' : 'Скрыт'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{getPriceDisplay(product)} сум</p>
                                        {product.variants && product.variants.length > 0 && (
                                            <p className="text-xs text-blue-600">
                                                {product.variants.map(v => v.size).join(' / ')}
                                            </p>
                                        )}
                                        {(() => {
                                            const t = stockTier(product.stockQuantity)
                                            return (
                                                <p className={`text-xs mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${t.bg} ${t.color}`}>
                                                    <Package className="w-3 h-3" />
                                                    {formatNumber(product.stockQuantity)} шт · {t.label}
                                                </p>
                                            )
                                        })()}
                                        {product.warehouseStocks && product.warehouseStocks.length > 0 && (
                                            <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{warehouseSummary(product.warehouseStocks)}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Link to={`/admin/products/${product.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <button onClick={() => handleDelete(product.id, product.nameRu)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Фото</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Код</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Название</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Категория</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Цена</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Размеры</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Остаток</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Статус</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">Загрузка...</td></tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">Товары не найдены</td></tr>
                        ) : filteredProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                        {product.images?.[0]?.url ? (
                                            <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                                        ) : <div className="w-full h-full flex items-center justify-center text-gray-400">📷</div>}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{product.code}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">{product.nameRu}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{product.category?.nameRu}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{getPriceDisplay(product)}</td>
                                <td className="px-4 py-3">
                                    {product.variants && product.variants.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {product.variants.map(v => (
                                                <span key={v.id} className={`px-1.5 py-0.5 rounded text-xs font-medium ${v.inStock ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400 line-through'}`}>
                                                    {v.size}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {(() => {
                                        const t = stockTier(product.stockQuantity)
                                        return (
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${t.bg} ${t.color} w-fit`} title={warehouseSummary(product.warehouseStocks)}>
                                                    <Package className="w-3 h-3" />
                                                    {formatNumber(product.stockQuantity)}
                                                </span>
                                                {product.warehouseStocks && product.warehouseStocks.length > 0 && (
                                                    <span className="text-[10px] text-gray-500 line-clamp-1 max-w-[180px]" title={warehouseSummary(product.warehouseStocks)}>{warehouseSummary(product.warehouseStocks)}</span>
                                                )}
                                            </div>
                                        )
                                    })()}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {product.isActive ? 'Активен' : 'Скрыт'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Link to={`/admin/products/${product.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <button onClick={() => handleDelete(product.id, product.nameRu)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    )
}