import crypto from 'crypto'
import { prisma } from '../config/database'

const EXPIRY_MINUTES = 15

export async function createMagicToken(telegramId: string | number | bigint): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const telegramBig = BigInt(telegramId)
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000)

  await prisma.adminMagicToken.create({
    data: {
      token,
      telegramId: telegramBig,
      expiresAt,
    },
  })

  // Cleanup old expired tokens (best effort)
  prisma.adminMagicToken.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }).catch(() => {})

  return token
}

export async function consumeMagicToken(token: string): Promise<bigint | null> {
  if (!token || typeof token !== 'string' || token.length < 20) return null

  const record = await prisma.adminMagicToken.findUnique({ where: { token } })
  if (!record) return null
  if (record.used) return null
  if (record.expiresAt < new Date()) return null

  // Mark as used
  await prisma.adminMagicToken.update({ where: { id: record.id }, data: { used: true } }).catch(() => {})

  return record.telegramId
}

export function getMagicLink(frontendUrl: string, token: string): string {
  // Prefer direct backend magic link for first-party cookie (avoids third-party cookie blocking)
  // Backend magic endpoint sets cookie and redirects to frontend dashboard
  const backendBase = process.env.API_URL?.replace(/\/api\/?$/, '').replace(/\/$/, '') || 'https://dekorhouse-api.onrender.com'
  // If backendBase already contains /api, keep it, else add /api
  const backendMagic = backendBase.includes('/api')
    ? `${backendBase}/admin/auth/magic?token=${encodeURIComponent(token)}`
    : `${backendBase}/api/admin/auth/magic?token=${encodeURIComponent(token)}`
  return backendMagic
}

export function getFrontendMagicLink(frontendUrl: string, token: string): string {
  const base = frontendUrl.replace(/\/$/, '')
  return `${base}/admin/magic?token=${encodeURIComponent(token)}`
}
