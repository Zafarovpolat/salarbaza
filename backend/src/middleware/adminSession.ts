import crypto from 'crypto'
import { Request, Response, NextFunction } from 'express'
import { config } from '../config'
import { prisma } from '../config/database'
import { logger } from '../utils/logger'

const COOKIE_NAME = 'decor_admin_session'
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60

function parseCookies(header?: string): Record<string, string> {
  if (!header) return {}
  return Object.fromEntries(
    header.split(';').map(part => {
      const index = part.indexOf('=')
      const key = index >= 0 ? part.slice(0, index).trim() : part.trim()
      const value = index >= 0 ? part.slice(index + 1).trim() : ''
      return [key, decodeURIComponent(value)]
    })
  )
}

function sign(payload: string): string {
  return crypto
    .createHmac('sha256', config.adminSessionSecret)
    .update(payload)
    .digest('base64url')
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

export function createAdminSession(telegramId: string): string {
  const now = Math.floor(Date.now() / 1000)
  const payload = Buffer.from(JSON.stringify({ v: 1, sub: telegramId, iat: now, exp: now + SESSION_TTL_SECONDS })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

interface SessionData {
  v: number
  sub: string
  iat: number
  exp: number
}

function parseSessionPayload(token?: string): SessionData | null {
  if (!token) return null
  const [payload, signature, ...rest] = token.split('.')
  if (!payload || !signature || rest.length > 0 || !safeEqual(signature, sign(payload))) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionData
    const now = Math.floor(Date.now() / 1000)
    if (data.v !== 1 || typeof data.sub !== 'string' || !Number.isInteger(data.iat) || !Number.isInteger(data.exp)) {
      return null
    }
    if (data.iat > now + 60) return null
    if (data.exp <= now) return null
    if (!/^\d+$/.test(data.sub)) return null
    return data
  } catch {
    return null
  }
}

export function getTelegramIdFromSession(token?: string): string | null {
  const data = parseSessionPayload(token)
  return data ? data.sub : null
}

export function verifyAdminSession(token?: string): boolean {
  const data = parseSessionPayload(token)
  if (!data) return false
  return config.adminTelegramIds.includes(data.sub)
}

export function setAdminCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/api/admin',
    maxAge: SESSION_TTL_SECONDS * 1000,
  })
}

export function clearAdminCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/api/admin',
  })
}

function validOrigin(req: Request): boolean {
  const origin = req.headers.origin
  if (!origin) return config.nodeEnv !== 'production'
  return origin === config.frontendUrl
}

export function frontendOriginOnly(req: Request, res: Response, next: NextFunction) {
  if (!validOrigin(req)) {
    return res.status(403).json({ success: false, message: 'Invalid request origin' })
  }
  next()
}

export async function adminAuth(req: Request, res: Response, next: NextFunction) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !validOrigin(req)) {
    return res.status(403).json({ success: false, message: 'Invalid request origin' })
  }
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME]
  const session = parseSessionPayload(token)
  if (!session) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
  const telegramIdStr = session.sub
  if (!config.adminTelegramIds.includes(telegramIdStr)) {
    return res.status(403).json({ success: false, message: 'Нет доступа' })
  }

  try {
    const telegramIdBig = BigInt(telegramIdStr)
    const user = await prisma.user.findUnique({
      where: { telegramId: telegramIdBig },
      select: { role: true, telegramId: true },
    })

    if (!user) {
      // Bootstrap: allow if in allowlist, user will be created on login
      return next()
    }

    if (user.role !== 'ADMIN') {
      // Auto-promote if allowlisted (handles post-migration case)
      if (config.adminTelegramIds.includes(telegramIdStr)) {
        try {
          await prisma.user.update({
            where: { telegramId: telegramIdBig },
            data: { role: 'ADMIN' as any },
          })
          logger.info(`🔐 Auto-promoted user ${telegramIdStr} to ADMIN via allowlist`)
          return next()
        } catch (e) {
          logger.warn(`Failed to auto-promote user ${telegramIdStr}: ${e}`)
          // Still allow since allowlist is source of truth for bootstrap
          return next()
        }
      }
      return res.status(403).json({ success: false, message: 'Нет доступа' })
    }

    return next()
  } catch (err) {
    logger.error(`adminAuth DB check failed for ${telegramIdStr}: ${err}`)
    // Fallback: if DB is unavailable, allow based on signed session + allowlist to avoid locking out admins
    // But log the incident
    return next()
  }
}

export function getAdminSessionFromRequest(req: Request): string | undefined {
  return parseCookies(req.headers.cookie)[COOKIE_NAME]
}
