import crypto from 'crypto'
import { Request, Response, NextFunction } from 'express'
import { config } from '../config'

function deriveScrypt(password: string, salt: Buffer, length: number, N: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, length, { N, r, p, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}
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

export function createAdminSession(): string {
  const now = Math.floor(Date.now() / 1000)
  const payload = Buffer.from(JSON.stringify({ v: 1, iat: now, exp: now + SESSION_TTL_SECONDS })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function verifyAdminSession(token?: string): boolean {
  if (!token) return false
  const [payload, signature, ...rest] = token.split('.')
  if (!payload || !signature || rest.length > 0 || !safeEqual(signature, sign(payload))) return false
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    const now = Math.floor(Date.now() / 1000)
    return data.v === 1 && Number.isInteger(data.iat) && Number.isInteger(data.exp) && data.iat <= now + 60 && data.exp > now
  } catch {
    return false
  }
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const encoded = config.adminPasswordHash
  const parts = encoded.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, nRaw, rRaw, pRaw, salt64, hash64] = parts
  const N = Number(nRaw)
  const r = Number(rRaw)
  const p = Number(pRaw)
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false
  const expected = Buffer.from(hash64, 'base64url')
  const actual = await deriveScrypt(password, Buffer.from(salt64, 'base64url'), expected.length, N, r, p)
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
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

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !validOrigin(req)) {
    return res.status(403).json({ success: false, message: 'Invalid request origin' })
  }
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME]
  if (!verifyAdminSession(token)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
  next()
}

export function getAdminSessionFromRequest(req: Request): string | undefined {
  return parseCookies(req.headers.cookie)[COOKIE_NAME]
}
