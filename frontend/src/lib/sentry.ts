import * as Sentry from '@sentry/react'

type BeforeSendHook = (event: Sentry.ErrorEvent, hint: Sentry.EventHint) => Sentry.ErrorEvent | null

const SENSITIVE_KEYS = [
  'phone',
  'address',
  'customerNote',
  'customerPhone',
  'customerName',
  'cookie',
  'authorization',
  'x-telegram-init-data',
  'x-telegram-init-data-lower',
  'x-telegram-init',
]

function scrubString(value: string): string {
  const lower = value.toLowerCase()
  for (const key of SENSITIVE_KEYS) {
    if (lower.includes(key)) return '[Filtered]'
  }
  return value
}

function scrubObject(obj: any, depth = 0): any {
  if (depth > 5) return '[Truncated]'
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') return scrubString(obj)
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map((v) => scrubObject(v, depth + 1))
  }
  const out: any = {}
  for (const [k, v] of Object.entries(obj)) {
    const lk = k.toLowerCase()
    if (
      lk.includes('phone') ||
      lk.includes('address') ||
      lk.includes('customernote') ||
      lk.includes('customername') ||
      lk.includes('cookie') ||
      lk.includes('authorization') ||
      lk.includes('x-telegram') ||
      lk.includes('initdata') ||
      lk === 'customerphone'
    ) {
      out[k] = '[Filtered]'
    } else if (typeof v === 'object') {
      out[k] = scrubObject(v, depth + 1)
    } else if (typeof v === 'string') {
      out[k] = scrubString(v)
    } else {
      out[k] = v
    }
  }
  return out
}

const beforeSend: BeforeSendHook = (event) => {
  // Filter out chunk load errors - handled via reload in router.tsx
  const excValues = (event.exception?.values || []) as any[]
  for (const exc of excValues) {
    const val = (exc.value || '').toLowerCase()
    if (val.includes('failed to fetch dynamically imported module') || val.includes('loading chunk') || val.includes('importing a module script failed')) {
      return null
    }
  }

  // Filter cookies
  if (event.request?.cookies) {
    event.request.cookies = '[Filtered]' as any
  }
  if (event.request?.headers) {
    const headers = event.request.headers as any
    for (const key of Object.keys(headers)) {
      const lk = key.toLowerCase()
      if (lk === 'cookie' || lk === 'authorization' || lk.includes('x-telegram') || lk.includes('init-data')) {
        headers[key] = '[Filtered]'
      }
    }
  }
  if (event.extra) {
    event.extra = scrubObject(event.extra)
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) => {
      if (b.data) b.data = scrubObject(b.data)
      if (b.message) b.message = scrubString(b.message)
      return b
    })
  }
  if ((event as any).user) {
    const user = (event as any).user
    if (user.ip_address) delete (event as any).user.ip_address
    if (user.phone) user.phone = '[Filtered]'
  }
  return event
}

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn) return

  const environment = import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'production'
  const release =
    (import.meta.env.VITE_SENTRY_RELEASE as string | undefined) ||
    (import.meta.env.VITE_GIT_SHA as string | undefined) ||
    (import.meta.env.VITE_RENDER_GIT_COMMIT as string | undefined) ||
    undefined

  const isProd = environment === 'production'
  const tracesSampleRate = isProd ? 0.07 : 1.0

  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate,
    sendDefaultPii: false,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend,
    integrations: (defaults) => {
      return defaults.filter((i) => {
        const name = (i as any).name || ''
        return !name.toLowerCase().includes('replay')
      })
    },
  })
}

export function captureNetworkError(endpoint: string, status: number | undefined, error: unknown) {
  try {
    if (status === 401 || status === 403) return
    Sentry.captureException(error, {
      tags: { type: 'network_error', endpoint },
      extra: { endpoint, status },
    })
  } catch {}
}
