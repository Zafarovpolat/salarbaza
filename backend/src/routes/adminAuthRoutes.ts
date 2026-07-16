import { Router } from 'express'
import { config } from '../config'
import { adminLoginRateLimiter } from '../middleware/rateLimiter'
import { clearAdminCookie, createAdminSession, frontendOriginOnly, getAdminSessionFromRequest, setAdminCookie, verifyAdminSession } from '../middleware/adminSession'
import { validateTelegramInitData } from '../utils/telegramAuth'
import { prisma } from '../config/database'
import { logger } from '../utils/logger'
import { consumeMagicToken } from '../services/magicLinkService'

const router = Router()

router.post('/telegram', frontendOriginOnly, adminLoginRateLimiter, async (req, res) => {
  try {
    const { user } = validateTelegramInitData(req.headers['x-telegram-init-data'] as string, config.botToken)
    const id = String(user.id)
    if (!config.adminTelegramIds.includes(id)) {
      return res.status(403).json({ success: false, message: 'Нет доступа' })
    }

    try {
      const telegramIdBig = BigInt(id)
      await prisma.user.upsert({
        where: { telegramId: telegramIdBig },
        update: { role: 'ADMIN' as any },
        create: {
          telegramId: telegramIdBig,
          username: user.username || null,
          firstName: user.first_name || null,
          lastName: user.last_name || null,
          role: 'ADMIN' as any,
        },
      })
    } catch (e) {
      logger.error(`Failed to upsert ADMIN user ${id}: ${e}`)
      // Continue - session will still be issued, adminAuth fallback allows bootstrap
    }

    setAdminCookie(res, createAdminSession(id))
    return res.json({ success: true })
  } catch {
    return res.status(401).json({ success: false, message: 'Откройте через Telegram-бота' })
  }
})

router.get('/session', (req, res) => {
  const v = verifyAdminSession(getAdminSessionFromRequest(req))
  res.status(v ? 200 : 401).json({ success: v })
})

router.post('/logout', frontendOriginOnly, (_q, res) => {
  clearAdminCookie(res)
  res.json({ success: true })
})

// Magic link - browser login after bot verification
// GET /api/admin/auth/magic?token=...  or POST {token}
router.all('/magic', async (req, res) => {
  try {
    const token = (req.query.token as string) || (req.body && (req.body as any).token)
    if (!token) return res.status(400).json({ success: false, message: 'Token required' })

    const telegramIdBig = await consumeMagicToken(token)
    if (!telegramIdBig) {
      return res.status(401).json({ success: false, message: 'Ссылка недействительна или просрочена. Снова /admin в боте' })
    }

    const idStr = telegramIdBig.toString()
    // Check allowlist again (in case IDs changed after token creation)
    if (!config.adminTelegramIds.includes(idStr)) {
      return res.status(403).json({ success: false, message: 'Нет доступа' })
    }

    // Ensure ADMIN role
    try {
      await prisma.user.upsert({
        where: { telegramId: telegramIdBig },
        update: { role: 'ADMIN' as any },
        create: { telegramId: telegramIdBig, role: 'ADMIN' as any },
      })
    } catch {}

    // Issue session cookie
    setAdminCookie(res, createAdminSession(idStr))
    // If it's a GET with browser, redirect to dashboard, else JSON
    const acceptsHtml = req.headers.accept?.includes('text/html')
    if (req.method === 'GET' && acceptsHtml) {
      return res.redirect(`${config.frontendUrl}/admin/dashboard`)
    }
    return res.json({ success: true })
  } catch (e) {
    logger.error('Magic link error', e)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

export default router
