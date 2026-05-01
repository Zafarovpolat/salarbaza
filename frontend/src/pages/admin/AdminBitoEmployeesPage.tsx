// frontend/src/pages/admin/AdminBitoEmployeesPage.tsx
//
// Список сотрудников из Bito ERP. Read-only, источник: bito_employees (7 записей).

import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Search, Download, Phone, Eye } from 'lucide-react'
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
  bitoCreatedAt: string | null
  bitoUpdatedAt: string | null
  createdAt: string
  updatedAt: string
}

const formatDate = (date: string | null) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export function AdminBitoEmployeesPage() {
  const [employees, setEmployees] = useState<BitoEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState<'all' | 'yes' | 'no'>('all')
  const [total, setTotal] = useState(0)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminService.getBitoEmployees({
        page: 1,
        limit: 200,
        search: search || undefined,
        isActive,
        sortBy: 'fullName',
        sortOrder: 'asc',
      })
      setEmployees(data.employees)
      setTotal(data.pagination.total)
    } catch {
      toast.error('Ошибка загрузки сотрудников')
    } finally {
      setLoading(false)
    }
  }, [search, isActive])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const timer = setTimeout(loadData, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await adminService.exportBitoEmployees()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bito_employees_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Экспорт завершён')
    } catch {
      toast.error('Ошибка экспорта')
    } finally {
      setExporting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Сотрудники Bito</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} сотрудников · импорт из Bito ERP (read-only)
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Экспорт...' : 'Экспорт CSV'}
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по ФИО, телефону, должности..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={isActive}
            onChange={(e) => setIsActive(e.target.value as 'all' | 'yes' | 'no')}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">Все</option>
            <option value="yes">Активные</option>
            <option value="no">Неактивные</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Загрузка...</div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Сотрудники не найдены</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ФИО
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Телефон
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Номер
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Должность
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    В Bito с
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{e.fullName}</div>
                          <div className="text-xs text-gray-400">{e.bitoId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {e.phone ? (
                        <a
                          href={`tel:${e.phone}`}
                          className="text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          {e.phone}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{e.number || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{e.positionName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{e.roleName || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                          e.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {e.isActive ? 'активен' : 'неактивен'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(e.bitoCreatedAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/bito-employees/${e.id}`}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-xs"
                      >
                        <Eye className="w-3 h-3" /> Открыть
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
