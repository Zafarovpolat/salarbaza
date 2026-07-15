import { Router } from 'express'
import { config } from '../config'
import { adminLoginRateLimiter } from '../middleware/rateLimiter'
import { clearAdminCookie, createAdminSession, frontendOriginOnly, getAdminSessionFromRequest, setAdminCookie, verifyAdminSession } from '../middleware/adminSession'
import { validateTelegramInitData } from '../utils/telegramAuth'
import { prisma } from '../config/database'
import { logger } from '../utils/logger'

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

export default router
