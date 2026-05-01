// frontend/src/pages/admin/AdminBitoEmployeeDetailPage.tsx
//
// Карточка сотрудника из Bito ERP. Read-only.

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Phone, Briefcase, Calendar, ExternalLink } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'
import toast from 'react-hot-toast'

interface BitoEmployee {
  id: string
  bitoId: string
  fullName: string
  phone: string | null
  number: string | null
  positionId: string | null
  positionName: string | null
  roleId: string | null
  roleName: string | null
  isActive: boolean
  rawData: Record<string, unknown> | null
  bitoCreatedAt: string | null
  bitoUpdatedAt: string | null
  createdAt: string
  updatedAt: string
}

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

export function AdminBitoEmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [employee, setEmployee] = useState<BitoEmployee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    adminService
      .getBitoEmployee(id)
      .then((data) => setEmployee(data.employee))
      .catch(() => toast.error('Сотрудник не найден'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-12 text-center text-gray-500">Загрузка...</div>
      </AdminLayout>
    )
  }

  if (!employee) {
    return (
      <AdminLayout>
        <div className="p-12 text-center text-gray-500">Сотрудник не найден</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Link
        to="/admin/bito-employees"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Назад к списку
      </Link>

      <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{employee.fullName}</h1>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                    employee.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {employee.isActive ? 'активен' : 'неактивен'}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Bito ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{employee.bitoId}</code>
              </p>
              {employee.number && (
                <p className="text-sm text-gray-500 mt-1">Номер: {employee.number}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Импортирован из Bito ERP</p>
            <p className="text-xs text-gray-500">
              <Calendar className="w-3 h-3 inline mr-1" />
              в Bito с {formatDate(employee.bitoCreatedAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Контакты</h2>
          <div>
            <p className="text-xs text-gray-500">Телефон</p>
            {employee.phone ? (
              <a
                href={`tel:${employee.phone}`}
                className="text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
              >
                <Phone className="w-4 h-4" />
                {employee.phone}
              </a>
            ) : (
              <p className="text-gray-400">—</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Роль и должность</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs text-gray-500">Должность</dt>
              <dd className="font-medium">{employee.positionName || '—'}</dd>
              {employee.positionId && (
                <dd className="font-mono text-xs text-gray-400">{employee.positionId}</dd>
              )}
            </div>
            <div>
              <dt className="text-xs text-gray-500">Роль</dt>
              <dd className="font-medium">{employee.roleName || '—'}</dd>
              {employee.roleId && (
                <dd className="font-mono text-xs text-gray-400">{employee.roleId}</dd>
              )}
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Системная информация</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-xs text-gray-500">ID в Supabase</dt>
            <dd className="font-mono text-xs">{employee.id}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Изменён в Bito</dt>
            <dd>{formatDate(employee.bitoUpdatedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Импортирован</dt>
            <dd>{formatDate(employee.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Обновлён локально</dt>
            <dd>{formatDate(employee.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      {employee.rawData && (
        <details className="bg-white rounded-xl p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900 inline-flex items-center gap-1">
            <ExternalLink className="w-4 h-4" />
            Сырые данные из Bito (JSON)
          </summary>
          <pre className="mt-3 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(employee.rawData, null, 2)}
          </pre>
        </details>
      )}
    </AdminLayout>
  )
}
