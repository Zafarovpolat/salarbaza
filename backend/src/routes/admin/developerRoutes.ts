import { Router } from 'express'
import { prisma } from '../../config/database'
import { config } from '../../config'
import { getCacheStats } from '../../utils/cache'
import { logger } from '../../utils/logger'
import * as Sentry from '@sentry/node'

const router = Router()

// In-memory cache for Sentry issues
let sentryIssuesCache: { data: any; expiry: number } | null = null
const SENTRY_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getPrismaVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require('@prisma/client/package.json')
    return pkg.version || 'unknown'
  } catch {
    return 'unknown'
  }
}

function getNodeVersion(): string {
  return process.version
}

function maskSecret(value: string | undefined): string {
  if (!value) return 'not configured'
  if (value.length <= 8) return '***'
  return value.slice(0, 3) + '***' + value.slice(-3)
}

router.get('/developer', async (req, res) => {
  const start = Date.now()
  let dbConnected = false
  let migrationInfo: any = {}
  try {
    await prisma.$queryRaw`SELECT 1`
    dbConnected = true
  } catch (e) {
    logger.error('DB connectivity check failed', e)
    dbConnected = false
  }

  try {
    const migrations = await prisma.$queryRaw<any[]>`SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 10`
    migrationInfo = {
      last10: migrations.map((m) => ({
        migration_name: m.migration_name,
        finished_at: m.finished_at,
        applied_steps_count: m.applied_steps_count,
      })),
      latest: migrations[0]?.migration_name || 'unknown',
      count: migrations.length,
    }
  } catch (e) {
    migrationInfo = { error: 'Unable to query _prisma_migrations', details: (e as any).message?.slice(0, 200) }
  }

  // Bito sync runs
  let lastFull: any = null
  let lastIncremental: any = null
  let lastErrors: any[] = []
  let bitoSummary: any = {}
  try {
    const recentRuns = await prisma.bitoSyncRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 30,
    })

    for (const run of recentRuns) {
      const stats: any = (run as any).stats || {}
      const mode = stats.mode || (stats.log ? (stats.log[0]?.includes('mode=full') ? 'full' : stats.log[0]?.includes('mode=incremental') ? 'incremental' : undefined) : undefined)
      // fallback: check stats nested
      const inferredMode = mode || stats?.mode || (run.errorLog ? undefined : undefined)

      // Prefer explicit mode from stats
      const runMode = (stats as any).mode || (stats as any).stats?.mode || inferredMode

      if (!lastFull && (runMode === 'full' || (stats as any)?.mode === 'full')) {
        lastFull = {
          id: run.id,
          startedAt: run.startedAt,
          finishedAt: run.finishedAt,
          status: run.status,
          dryRun: run.dryRun,
          stats: (run as any).stats,
          errorLog: run.errorLog ? run.errorLog.slice(0, 500) : null,
        }
      }
      if (!lastIncremental && (runMode === 'incremental' || (stats as any)?.mode === 'incremental')) {
        lastIncremental = {
          id: run.id,
          startedAt: run.startedAt,
          finishedAt: run.finishedAt,
          status: run.status,
          dryRun: run.dryRun,
          stats: (run as any).stats,
          errorLog: run.errorLog ? run.errorLog.slice(0, 500) : null,
        }
      }
    }

    // If mode not stored, fallback to last two runs
    if (!lastFull && recentRuns.length > 0) {
      // Assume last run that has creates is full, else most recent
      const candidate = recentRuns.find((r: any) => {
        const s = (r.stats as any) || {}
        return s.products?.created > 0 || s.customers || s.employees
      })
      if (candidate) {
        lastFull = {
          id: candidate.id,
          startedAt: candidate.startedAt,
          finishedAt: candidate.finishedAt,
          status: candidate.status,
          stats: candidate.stats,
        }
      }
    }

    lastErrors = recentRuns
      .filter((r) => r.status === 'error')
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        startedAt: r.startedAt,
        errorLog: r.errorLog ? r.errorLog.slice(0, 1000) : null,
        stats: r.stats,
      }))

    bitoSummary = {
      totalRuns: recentRuns.length,
      lastRunAt: recentRuns[0]?.startedAt || null,
      errorCount: recentRuns.filter((r) => r.status === 'error').length,
    }
  } catch (e) {
    bitoSummary = { error: (e as any).message?.slice(0, 300) }
  }

  const cacheStats = getCacheStats()

  const data = {
    timestamp: new Date().toISOString(),
    backend: {
      health: 'ok',
      environment: config.nodeEnv,
      deploySha: config.sentryRelease || process.env.RENDER_GIT_COMMIT || process.env.GIT_SHA || 'unknown',
      nodeVersion: getNodeVersion(),
      prismaVersion: getPrismaVersion(),
      uptimeSeconds: Math.floor(process.uptime()),
      sentryConfigured: !!config.sentryDsn,
      sentry: config.sentryDsn ? { configured: true, dsnMasked: maskSecret(config.sentryDsn), org: process.env.SENTRY_ORG || 'dekorhouse' } : { configured: false },
      dbConnectivity: dbConnected,
      migration: migrationInfo,
      cache: {
        provider: process.env.REDIS_URL ? 'redis' : 'memory',
        stats: cacheStats,
      },
      analytics: {
        // Placeholder - will be implemented in PR6
        status: 'not_implemented',
      },
      imageOptimization: {
        // Placeholder - PR7
        status: 'not_implemented',
        queue: 0,
      },
    },
    frontend: {
      // Frontend health is checked client-side, but we provide expected URL
      url: config.frontendUrl,
      sentryConfigured: true, // frontend will check via env
    },
    bito: {
      lastFullSync: lastFull,
      lastIncrementalSync: lastIncremental,
      lastErrors,
      summary: bitoSummary,
    },
    versions: {
      node: getNodeVersion(),
      prisma: getPrismaVersion(),
    },
    responseTimeMs: Date.now() - start,
  }

  // Intentionally do NOT expose:
  // - full DSN, auth token, DATABASE_URL, BOT_TOKEN, service_role, BITO key
  res.json({ success: true, data })
})

// Test error endpoints for Sentry smoke (admin only)
router.get('/developer/sentry-test-error', (req, res) => {
  const err = new Error(`Backend test error from /admin/developer at ${new Date().toISOString()}`)
  Sentry.captureException(err, { tags: { source: 'developer_page_test', endpoint: 'sentry-test-error' } })
  throw err
})

router.post('/developer/sentry-test-backend', (req, res) => {
  const err = new Error(`Backend test error POST from /admin/developer at ${new Date().toISOString()}`)
  // Ensure no PII in extra
  Sentry.captureException(err, { tags: { source: 'developer_page_test' }, extra: { test: true } })
  throw err
})

// Optional: Sentry issues proxy
router.get('/developer/sentry-issues', async (req, res) => {
  const authToken = process.env.SENTRY_AUTH_TOKEN
  const org = process.env.SENTRY_ORG || 'dekorhouse'
  const backendProject = process.env.SENTRY_PROJECT_BACKEND || 'backend'
  const frontendProject = process.env.SENTRY_PROJECT_FRONTEND || 'frontend'

  if (!authToken) {
    return res.status(200).json({
      success: true,
      data: { configured: false, message: 'SENTRY_AUTH_TOKEN not configured' },
    })
  }

  // Simple rate limit: if cache valid, return cache
  if (sentryIssuesCache && Date.now() < sentryIssuesCache.expiry) {
    return res.json({ success: true, data: sentryIssuesCache.data, cached: true })
  }

  try {
    const fetchIssues = async (project: string) => {
      const url = `https://us.sentry.io/api/0/projects/${org}/${project}/issues/?per_page=5&statsPeriod=24h`
      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      if (!resp.ok) {
        const txt = await resp.text()
        logger.warn(`Sentry API error for ${project}: ${resp.status} ${txt.slice(0, 200)}`)
        return { project, error: `Sentry API ${resp.status}`, issues: [] }
      }
      const issues = await resp.json()
      // Map to short fields only
      const mapped = (Array.isArray(issues) ? issues : []).slice(0, 5).map((iss: any) => ({
        id: iss.id,
        shortId: iss.shortId,
        title: iss.title?.slice(0, 200),
        level: iss.level,
        status: iss.status,
        count: iss.count,
        userCount: iss.userCount,
        firstSeen: iss.firstSeen,
        lastSeen: iss.lastSeen,
        permalink: iss.permalink,
      }))
      return { project, issues: mapped }
    }

    const [backendIssues, frontendIssues] = await Promise.all([
      fetchIssues(backendProject).catch((e) => ({ project: backendProject, error: (e as any).message, issues: [] })),
      fetchIssues(frontendProject).catch((e) => ({ project: frontendProject, error: (e as any).message, issues: [] })),
    ])

    const result = {
      configured: true,
      org,
      projects: {
        backend: backendIssues,
        frontend: frontendIssues,
      },
      dashboardLinks: {
        backend: `https://dekorhouse.sentry.io/issues/?project=${backendProject}`,
        frontend: `https://dekorhouse.sentry.io/issues/?project=${frontendProject}`,
        org: `https://dekorhouse.sentry.io/issues/`,
      },
      fetchedAt: new Date().toISOString(),
    }

    sentryIssuesCache = { data: result, expiry: Date.now() + SENTRY_CACHE_TTL }

    res.json({ success: true, data: result })
  } catch (err: any) {
    logger.error('Sentry proxy failed', err)
    try {
      Sentry.captureException(err)
    } catch {}
    res.status(200).json({
      success: true,
      data: { configured: true, error: err.message?.slice(0, 300), hint: 'Check SENTRY_AUTH_TOKEN scopes need project:read' },
    })
  }
})

export default router
