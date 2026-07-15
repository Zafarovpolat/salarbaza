import api from '@/services/api'

const SESSION_KEY = 'decormarket-analytics-session'

function getSessionId(): string {
  let sid = localStorage.getItem(SESSION_KEY)
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(SESSION_KEY, sid)
  }
  return sid
}

type AnalyticsEvent =
  | 'product_view'
  | 'category_view'
  | 'search'
  | 'search_no_results'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_started'
  | 'order_created'
  | 'order_cancelled'

interface TrackOptions {
  productId?: string
  categoryId?: string
  orderId?: string
  source?: string
  metadata?: Record<string, any>
}

function track(event: AnalyticsEvent, opts: TrackOptions = {}) {
  try {
    const payload = {
      event,
      sessionId: getSessionId(),
      productId: opts.productId,
      categoryId: opts.categoryId,
      orderId: opts.orderId,
      source: opts.source,
      metadata: opts.metadata,
    }
    // Fire and forget, never block UI
    api.post('/analytics/events', payload).catch(() => {})
  } catch {}
}

function trackBatch(events: Array<{ event: AnalyticsEvent } & TrackOptions>) {
  try {
    if (events.length === 0) return
    if (events.length > 20) events = events.slice(0, 20)
    const sessionId = getSessionId()
    const payload = {
      events: events.map((e) => ({
        event: e.event,
        sessionId,
        productId: e.productId,
        categoryId: e.categoryId,
        orderId: e.orderId,
        source: e.source,
        metadata: e.metadata,
      })),
    }
    api.post('/analytics/events', payload).catch(() => {})
  } catch {}
}

export const analyticsService = {
  getSessionId,
  track,
  trackBatch,
}
