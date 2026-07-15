import { beforeEach, describe, it, expect, vi, beforeAll } from 'vitest'

const mockFindUnique = vi.fn()
const mockUpdate = vi.fn()

vi.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
  },
}))

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

beforeEach(() => {
  vi.resetModules()
  process.env.NODE_ENV = 'test'
  process.env.ADMIN_SESSION_SECRET = 'test-secret'
  process.env.ADMIN_TELEGRAM_IDS = '123456789,987654321'
  process.env.FRONTEND_URL = 'http://localhost:3000'
  mockFindUnique.mockReset()
  mockUpdate.mockReset()
})

describe('session basic', () => {
  it('binds admin ID', async () => {
    const m = await import('./adminSession')
    expect(m.verifyAdminSession(m.createAdminSession('123456789'))).toBe(true)
    expect(m.verifyAdminSession(m.createAdminSession('2'))).toBe(false)
  })

  it('extracts telegram id', async () => {
    const m = await import('./adminSession')
    const token = m.createAdminSession('123456789')
    expect(m.getTelegramIdFromSession(token)).toBe('123456789')
    expect(m.getTelegramIdFromSession('invalid')).toBe(null)
  })
})

describe('adminAuth role check', () => {
  async function callAdminAuth(token?: string) {
    const mod = await import('./adminSession')
    const req = {
      method: 'GET',
      headers: {
        cookie: token ? `decor_admin_session=${token}` : '',
        origin: 'http://localhost:3000',
      },
    } as any
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any
    const next = vi.fn()
    await mod.adminAuth(req, res, next)
    return { res, next, mod }
  }

  it('ADMIN has access', async () => {
    const mod = await import('./adminSession')
    const token = mod.createAdminSession('123456789')
    mockFindUnique.mockResolvedValue({ role: 'ADMIN', telegramId: BigInt(123456789) })

    const { res, next } = await callAdminAuth(token)
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('USER does not have admin access when not in allowlist? Actually allowlist overrides, so USER in allowlist gets promoted', async () => {
    const mod = await import('./adminSession')
    const token = mod.createAdminSession('123456789')
    // user exists as USER but is allowlisted, should be auto-promoted and allowed
    mockFindUnique.mockResolvedValue({ role: 'USER', telegramId: BigInt(123456789) })
    mockUpdate.mockResolvedValue({})

    const { res, next } = await callAdminAuth(token)
    expect(next).toHaveBeenCalled()
  })

  it('USER without allowlist is denied', async () => {
    const mod = await import('./adminSession')
    // create token for non-allowlisted? But verify will fail if not allowlisted.
    // So we test with allowlist id but user is USER and not allowlisted promotion path blocked?
    // Actually for non-allowlisted, verifyAdminSession already fails -> 403 from earlier check
    // So we test a user that is allowlisted but we simulate a user that is USER and we want deny when not allowlisted?
    // Let's test token for 111 which is not in allowlist -> should be denied regardless of DB
    const token = mod.createAdminSession('111111111')
    mockFindUnique.mockResolvedValue({ role: 'USER', telegramId: BigInt(111111111) })

    const req = {
      method: 'GET',
      headers: {
        cookie: `decor_admin_session=${token}`,
        origin: 'http://localhost:3000',
      },
    } as any
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any
    const next = vi.fn()
    await mod.adminAuth(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('bootstrap allows when user not found but token allowlisted', async () => {
    const mod = await import('./adminSession')
    const token = mod.createAdminSession('987654321')
    mockFindUnique.mockResolvedValue(null)

    const { next, res } = await callAdminAuth(token)
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('non-allowlisted token denied even if DB has ADMIN', async () => {
    const mod = await import('./adminSession')
    const token = mod.createAdminSession('555555555')
    mockFindUnique.mockResolvedValue({ role: 'ADMIN', telegramId: BigInt(555555555) })

    const req = {
      method: 'GET',
      headers: {
        cookie: `decor_admin_session=${token}`,
        origin: 'http://localhost:3000',
      },
    } as any
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any
    const next = vi.fn()
    await mod.adminAuth(req, res, next)
    // allowlist check happens before DB, so should be 403
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })
})
