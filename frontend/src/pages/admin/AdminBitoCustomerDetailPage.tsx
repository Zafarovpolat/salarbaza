// frontend/src/pages/admin/AdminBitoCustomerDetailPage.tsx
//
// Детальная карточка клиента из Bito ERP. Read-only — изменить ничего нельзя,
// данные приходят из bito_customers (синхронизированы из Bito).

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Phone, CreditCard, Wallet, Award, Calendar, ExternalLink } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'
import toast from 'react-hot-toast'

interface BitoCustomer {
  id: string
  bitoId: string
  type: string | null
  name: string
  phone: string | null
  extraPhones: string[] | null
  cardNumber: string | null
  bitoCategoryId: string | null
  responsibleId: string | null
  totalSale: number
  avgSale: number
  point: number
  balance: number
  balanceCurrency: string | null
  isActive: boolean
  rawData: Record<string, unknown> | null
  bitoCreatedAt: string | null
  bitoUpdatedAt: string | null
  createdAt: string
  updatedAt: string
}

const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price) + ' сум'

const formatDate = (date: string | null) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminBitoCustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<BitoCustomer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    adminService
      .getBitoCustomer(id)
      .then((data) => setCustomer(data.customer))
      .catch(() => toast.error('Клиент не найден'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-12 text-center text-gray-500">Загрузка...</div>
      </AdminLayout>
    )
  }

  if (!customer) {
    return (
      <AdminLayout>
        <div className="p-12 text-center text-gray-500">Клиент не найден</div>
      </AdminLayout>
    )
  }

  const balanceColor =
    customer.balance < 0 ? 'text-red-600' : customer.balance > 0 ? 'text-green-600' : 'text-gray-700'

  return (
    <AdminLayout>
      {/* Back link */}
      <Link
        to="/admin/bito-customers"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Назад к списку
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                  customer.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {customer.isActive ? 'активен' : 'неактивен'}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Bito ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{customer.bitoId}</code>
            </p>
            {customer.type && <p className="text-sm text-gray-500 mt-1">Тип: {customer.type}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Импортирован из Bito ERP</p>
            <p className="text-xs text-gray-500">
              <Calendar className="w-3 h-3 inline mr-1" />
              в Bito с {formatDate(customer.bitoCreatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Contacts */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Контакты</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Основной телефон</p>
            {customer.phone ? (
              <a
                href={`tel:${customer.phone}`}
                className="text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
              >
                <Phone className="w-4 h-4" />
                {customer.phone}
              </a>
            ) : (
              <p className="text-gray-400">—</p>
            )}
          </div>
          {customer.extraPhones && customer.extraPhones.length > 0 && (
            <div>
              <p className="text-xs text-gray-500">Доп. телефоны</p>
              <div className="space-y-1 mt-1">
                {customer.extraPhones.map((p, i) => (
                  <a
                    key={i}
                    href={`tel:${p}`}
                    className="block text-blue-600 hover:underline text-sm"
                  >
                    {p}
                  </a>
                ))}
              </div>
            </div>
          )}
          {customer.cardNumber && (
            <div>
              <p className="text-xs text-gray-500">Карта</p>
              <p className="font-mono text-sm flex items-center gap-1 mt-1">
                <CreditCard className="w-4 h-4 text-gray-400" />
                {customer.cardNumber}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">Кол-во покупок</p>
          <p className="text-2xl font-bold mt-1">{customer.totalSale}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">Средний чек</p>
          <p className="text-2xl font-bold mt-1">{formatPrice(customer.avgSale)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Wallet className="w-3 h-3" /> Баланс
          </div>
          <p className={`text-2xl font-bold mt-1 ${balanceColor}`}>{formatPrice(customer.balance)}</p>
          {customer.balanceCurrency && (
            <p className="text-xs text-gray-400 mt-0.5">валюта: {customer.balanceCurrency}</p>
          )}
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Award className="w-3 h-3" /> Бонусные баллы
          </div>
          <p className="text-2xl font-bold mt-1">{customer.point}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Системная информация</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-xs text-gray-500">ID в Supabase</dt>
            <dd className="font-mono text-xs">{customer.id}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Bito category ID</dt>
            <dd className="font-mono text-xs">{customer.bitoCategoryId || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Ответственный (Bito ID)</dt>
            <dd className="font-mono text-xs">{customer.responsibleId || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Изменён в Bito</dt>
            <dd>{formatDate(customer.bitoUpdatedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Импортирован</dt>
            <dd>{formatDate(customer.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Обновлён локально</dt>
            <dd>{formatDate(customer.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      {/* Raw data */}
      {customer.rawData && (
        <details className="bg-white rounded-xl p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900 inline-flex items-center gap-1">
            <ExternalLink className="w-4 h-4" />
            Сырые данные из Bito (JSON)
          </summary>
          <pre className="mt-3 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(customer.rawData, null, 2)}
          </pre>
        </details>
      )}
    </AdminLayout>
  )
}
