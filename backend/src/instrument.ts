import * as Sentry from '@sentry/node'
import { config } from './config'

function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  // Scrub headers
  if (event.request?.headers) {
    const headers = event.request.headers as any
    for (const key of Object.keys(headers)) {
      const lk = key.toLowerCase()
      if (
        lk === 'cookie' ||
        lk === 'authorization' ||
        lk.includes('x-telegram') ||
        lk.includes('init-data') ||
        lk === 'x-telegram-init-data'
      ) {
        headers[key] = '[Filtered]'
      }
    }
  }
  if (event.request?.cookies) {
    event.request.cookies = '[Filtered]' as any
  }

  // Scrub extra data
  const sensitiveKeys = ['phone', 'address', 'customerNote', 'customerPhone', 'customerName', 'botToken', 'serviceRole', 'databaseUrl', 'supabase']

  function scrub(obj: any, depth = 0): any {
    if (depth > 5) return '[Truncated]'
    if (!obj || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        const low = obj.toLowerCase()
        // scrub tokens and secrets in strings
        if (low.includes('bot') && low.includes('token')) return '[Filtered]'
        if (low.includes('service_role') || low.includes('supabase') || low.includes('postgres://')) {
          return '[Filtered]'
        }
        return obj
      }
      return obj
    }
    if (Array.isArray(obj)) return obj.map((v) => scrub(v, depth + 1))
    const out: any = {}
    for (const [k, v] of Object.entries(obj)) {
      const lk = k.toLowerCase()
      if (
        lk.includes('phone') ||
        lk.includes('address') ||
        lk.includes('customernote') ||
        lk.includes('customername') ||
        lk === 'bot_token' ||
        lk === 'bottoken' ||
        lk.includes('service_role') ||
        lk.includes('supabase_service') ||
        lk === 'database_url' ||
        lk === 'databaseurl' ||
        lk === 'direct_url' ||
        lk === 'directurl' ||
        lk.includes('authorization') ||
        lk.includes('cookie') ||
        lk.includes('x-telegram')
      ) {
        out[k] = '[Filtered]'
      } else if (typeof v === 'object') {
        out[k] = scrub(v, depth + 1)
      } else if (typeof v === 'string' && (v.includes('postgres://') || v.startsWith('eyJ') || v.length > 100)) {
        // Heuristically filter potential secrets: DB URLs, JWTs, long tokens
        // Keep short strings that are obviously not secrets
        if (v.includes('postgres://') || v.includes('supabase') || (v.startsWith('eyJ') && v.length > 100)) {
          out[k] = '[Filtered]'
        } else {
          out[k] = v
        }
      } else {
        out[k] = v
      }
    }
    return out
  }

  if (event.extra) event.extra = scrub(event.extra)
  if (event.contexts) event.contexts = scrub(event.contexts)
  if ((event as any).user) {
    const user = (event as any).user
    if (user.ip_address) delete (event as any).user.ip_address
    if (user.phone) user.phone = '[Filtered]'
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) => {
      if (b.data) b.data = scrub(b.data)
      return b
    })
  }

  return event
}

if (config.sentryDsn) {
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.sentryEnvironment,
    release: config.sentryRelease,
    sendDefaultPii: false,
    tracesSampleRate: config.nodeEnv === 'production' ? 0.07 : 1.0,
    beforeSend(event) {
      return scrubEvent(event as Sentry.ErrorEvent) as any
    },
  })
}
