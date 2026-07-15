import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import api, { get } from '@/services/api'
import * as Sentry from '@sentry/react'

interface DeveloperData {
  timestamp: string
  backend: {
    health: string
    environment: string
    deploySha: string
    nodeVersion: string
    prismaVersion: string
    uptimeSeconds: number
    sentryConfigured: boolean
    sentry: { configured: boolean; dsnMasked: string; org: string }
    dbConnectivity: boolean
    migration: any
    cache: { provider: string; stats: any }
    analytics: any
    imageOptimization: any
  }
  frontend: { url: string; sentryConfigured: boolean }
  bito: {
    lastFullSync: any
    lastIncrementalSync: any
    lastErrors: any[]
    summary: any
  }
  versions: { node: string; prisma: string }
  responseTimeMs: number
}

interface SentryIssuesData {
  configured: boolean
  org?: string
  projects?: any
  dashboardLinks?: any
  error?: string
  message?: string
  fetchedAt?: string
}

export function AdminDeveloperPage() {
  const [data, setData] = useState<DeveloperData | null>(null)
  const [sentryIssues, setSentryIssues] = useState<SentryIssuesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [issuesLoading, setIssuesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await get<{ success: boolean; data: DeveloperData }>('/admin/developer')
      setData(res.data)
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const loadSentryIssues = async () => {
    setIssuesLoading(true)
    try {
      const res = await get<{ success: boolean; data: SentryIssuesData }>('/admin/developer/sentry-issues')
      setSentryIssues(res.data)
    } catch (e: any) {
      setSentryIssues({ configured: false, error: e.message })
    } finally {
      setIssuesLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const triggerFrontendError = () => {
    try {
      throw new Error('Frontend test error from /admin/developer at ' + new Date().toISOString())
    } catch (err) {
      Sentry.captureException(err, { tags: { source: 'developer_page_test' } })
      alert('Frontend test error captured to Sentry (check dashboard)')
    }
  }

  const triggerBackendError = async () => {
    try {
      // admin-only test endpoint - if not implemented, will 404 but still test Sentry manually
      await api.get('/admin/developer/sentry-test-error')
    } catch (e: any) {
      // If endpoint doesn't exist, fallback to direct Sentry call that simulates backend error via frontend capture
      // In real backend test, we would call an endpoint that throws
      alert('Backend test: endpoint not found, use backend direct test. ' + (e.message || ''))
    }
  }

  const triggerBackendDirect = async () => {
    try {
      await api.post('/admin/developer/sentry-test-backend', { test: true })
    } catch (e: any) {
      alert('Backend test error request sent (check Sentry). Response: ' + (e.message || 'error'))
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
        </div>
      </AdminLayout>
    )
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-red-600">Ошибка: {error}</p>
          <button onClick={load} className="mt-4 px-4 py-2 bg-green-600 text-white rounded">Retry</button>
        </div>
      </AdminLayout>
    )
  }

  const fmtUptime = (sec: number) => {
    const d = Math.floor(sec / 86400)
    const h = Math.floor((sec % 86400) / 3600)
    const m = Math.floor((sec % 3600) / 60)
    return `${d}d ${h}h ${m}m`
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Developer Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Backend health */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Backend</h2>
          <ul className="text-sm space-y-1">
            <li>Health: <span className={data.backend.health === 'ok' ? 'text-green-600' : 'text-red-600'}>{data.backend.health}</span></li>
            <li>Environment: {data.backend.environment}</li>
            <li>Deploy SHA: <code className="bg-gray-100 px-1 rounded text-xs">{data.backend.deploySha?.slice(0, 12)}</code></li>
            <li>Node: {data.backend.nodeVersion}</li>
            <li>Prisma: {data.backend.prismaVersion}</li>
            <li>Uptime: {fmtUptime(data.backend.uptimeSeconds)}</li>
            <li>DB: {data.backend.dbConnectivity ? '✅ connected' : '❌ disconnected'}</li>
            <li>Cache: {data.backend.cache.provider} — hits {data.backend.cache.stats.hits} / misses {data.backend.cache.stats.misses} ({data.backend.cache.stats.hitRate}%) size {data.backend.cache.stats.size}</li>
            <li>Sentry: {data.backend.sentryConfigured ? `✅ configured (${data.backend.sentry.dsnMasked})` : '❌ not configured'}</li>
            <li>Response: {data.responseTimeMs}ms</li>
          </ul>
        </div>

        {/* Frontend */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Frontend</h2>
          <ul className="text-sm space-y-1">
            <li>URL: {data.frontend.url}</li>
            <li>Sentry DSN: {import.meta.env.VITE_SENTRY_DSN ? '✅ configured' : '❌ not configured'}</li>
            <li>Mode: {import.meta.env.MODE}</li>
            <li>Release: {import.meta.env.VITE_SENTRY_RELEASE || import.meta.env.VITE_GIT_SHA || 'unknown'}</li>
            <li>API: {import.meta.env.VITE_API_URL}</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <button onClick={triggerFrontendError} className="px-3 py-1.5 bg-orange-500 text-white rounded text-sm">Test Frontend Sentry</button>
            <button onClick={triggerBackendDirect} className="px-3 py-1.5 bg-red-500 text-white rounded text-sm">Test Backend Sentry</button>
          </div>
        </div>

        {/* Migrations */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Prisma Migrations</h2>
          {data.backend.migration.error ? (
            <p className="text-sm text-red-600">{data.backend.migration.error}</p>
          ) : (
            <>
              <p className="text-sm">Latest: <code className="bg-gray-100 px-1 rounded">{data.backend.migration.latest}</code> ({data.backend.migration.count} total)</p>
              <ul className="mt-2 text-xs space-y-1 max-h-40 overflow-auto">
                {data.backend.migration.last10?.map((m: any) => (
                  <li key={m.migration_name} className="flex justify-between">
                    <span className="truncate">{m.migration_name}</span>
                    <span className="text-gray-400">{new Date(m.finished_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Bito sync */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Bito Sync</h2>
          <div className="text-sm space-y-2">
            <div>
              <p className="font-medium">Last Full:</p>
              {data.bito.lastFullSync ? (
                <>
                  <p>{new Date(data.bito.lastFullSync.startedAt).toLocaleString()} — {data.bito.lastFullSync.status}</p>
                  <pre className="bg-gray-50 p-2 rounded text-xs max-h-24 overflow-auto">{JSON.stringify(data.bito.lastFullSync.stats?.products || data.bito.lastFullSync.stats, null, 2)}</pre>
                </>
              ) : <p className="text-gray-400">No data</p>}
            </div>
            <div>
              <p className="font-medium">Last Incremental:</p>
              {data.bito.lastIncrementalSync ? (
                <>
                  <p>{new Date(data.bito.lastIncrementalSync.startedAt).toLocaleString()} — {data.bito.lastIncrementalSync.status}</p>
                  <pre className="bg-gray-50 p-2 rounded text-xs max-h-24 overflow-auto">{JSON.stringify(data.bito.lastIncrementalSync.stats?.products || data.bito.lastIncrementalSync.stats, null, 2)}</pre>
                </>
              ) : <p className="text-gray-400">No data</p>}
            </div>
            <div>
              <p className="font-medium">Errors ({data.bito.summary.errorCount} total, last 5):</p>
              {data.bito.lastErrors.length === 0 ? <p className="text-green-600">No errors ✅</p> : (
                <ul className="space-y-1">
                  {data.bito.lastErrors.map((e: any) => (
                    <li key={e.id} className="bg-red-50 p-1 rounded text-xs">
                      <span>{new Date(e.startedAt).toLocaleString()}</span>
                      <pre className="whitespace-pre-wrap">{e.errorLog?.slice(0, 300)}</pre>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Sentry */}
        <div className="bg-white rounded-xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Sentry</h2>
            <button onClick={loadSentryIssues} disabled={issuesLoading} className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50">
              {issuesLoading ? 'Loading...' : 'Load Issues'}
            </button>
          </div>
          <p className="text-sm">Dashboard: <a href="https://dekorhouse.sentry.io/issues/" target="_blank" rel="noreferrer" className="text-blue-600 underline">Sentry Dashboard</a></p>
          {sentryIssues ? (
            <div className="mt-3">
              {sentryIssues.error || sentryIssues.message ? (
                <p className="text-sm text-orange-600">{sentryIssues.error || sentryIssues.message}</p>
              ) : (
                <>
                  <p className="text-xs text-gray-500">Fetched {sentryIssues.fetchedAt}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {Object.entries(sentryIssues.projects || {}).map(([key, proj]: any) => (
                      <div key={key} className="border rounded p-2">
                        <p className="font-medium text-sm">{key} ({proj.project || key})</p>
                        {proj.error ? <p className="text-xs text-red-500">{proj.error}</p> : (
                          proj.issues?.length === 0 ? <p className="text-xs text-gray-400">No issues 🎉</p> : (
                            <ul className="text-xs space-y-1">
                              {proj.issues.map((iss: any) => (
                                <li key={iss.id} className="border-b pb-1">
                                  <a href={iss.permalink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{iss.title}</a>
                                  <div className="text-gray-500">{iss.level} · {iss.status} · count {iss.count} · {new Date(iss.lastSeen).toLocaleString()}</div>
                                </li>
                              ))}
                            </ul>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                  {sentryIssues.dashboardLinks && (
                    <div className="mt-2 text-xs space-x-3">
                      <a href={sentryIssues.dashboardLinks.backend} target="_blank" rel="noreferrer" className="text-blue-600 underline">Backend issues</a>
                      <a href={sentryIssues.dashboardLinks.frontend} target="_blank" rel="noreferrer" className="text-blue-600 underline">Frontend issues</a>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : <p className="text-sm text-gray-400">Click Load Issues to fetch (cached 5min, rate limited)</p>}
        </div>

        {/* Cache & other */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-3">System</h2>
          <ul className="text-sm space-y-1">
            <li>Analytics: {data.backend.analytics.status}</li>
            <li>Image Optimization: {data.backend.imageOptimization.status}</li>
            <li>Uptime: {fmtUptime(data.backend.uptimeSeconds)}</li>
          </ul>
        </div>

      </div>

      <div className="mt-6 text-xs text-gray-400">
        <p>Secrets are never exposed: DSN masked, tokens hidden, DB URL not shown.</p>
        <p>Last update: {new Date(data.timestamp).toLocaleString()}</p>
      </div>
    </AdminLayout>
  )
}
