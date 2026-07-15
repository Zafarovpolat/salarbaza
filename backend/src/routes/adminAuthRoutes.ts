import { Router } from 'express'
import { z } from 'zod'
import { adminLoginRateLimiter } from '../middleware/rateLimiter'
import {
  clearAdminCookie,
  createAdminSession,
  frontendOriginOnly,
  getAdminSessionFromRequest,
  setAdminCookie,
  verifyAdminPassword,
  verifyAdminSession,
} from '../middleware/adminSession'

const router = Router()
const loginSchema = z.object({ password: z.string().min(8).max(256) })

router.post('/login', frontendOriginOnly, adminLoginRateLimiter, async (req, res, next) => {
  try {
    const { password } = loginSchema.parse(req.body)
    if (!await verifyAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Неверный пароль' })
    }
    setAdminCookie(res, createAdminSession())
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

router.get('/session', (req, res) => {
  const valid = verifyAdminSession(getAdminSessionFromRequest(req))
  res.status(valid ? 200 : 401).json({ success: valid })
})

router.post('/logout', frontendOriginOnly, (req, res) => {
  clearAdminCookie(res)
  res.json({ success: true })
})

export default router
