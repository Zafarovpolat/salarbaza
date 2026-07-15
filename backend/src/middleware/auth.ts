import { Request, Response, NextFunction } from 'express'
import { config } from '../config'
import { prisma } from '../config/database'
import { logger } from '../utils/logger'
import { validateTelegramInitData } from '../utils/telegramAuth'

export interface AuthRequest extends Request {
    user?: {
        id: string
        telegramId: bigint
        username?: string | null
        firstName?: string | null
        lastName?: string | null
    }
}

export async function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const initData = req.headers['x-telegram-init-data'] as string

        logger.info(`🔐 Auth check: ${req.method} ${req.path}`)
        logger.info(`📱 InitData present: ${!!initData}, length: ${initData?.length || 0}`)

        if (!initData) {
            if (config.nodeEnv === 'development') {
                logger.info('🧪 Dev mode - using test user')
                const testUser = await prisma.user.upsert({
                    where: { telegramId: BigInt(123456789) },
                    update: {},
                    create: {
                        telegramId: BigInt(123456789),
                        username: 'testuser',
                        firstName: 'Test',
                        lastName: 'User',
                    },
                })
                req.user = {
                    id: testUser.id,
                    telegramId: testUser.telegramId,
                    username: testUser.username,
                    firstName: testUser.firstName,
                    lastName: testUser.lastName,
                }
                return next()
            }

            logger.warn('❌ No initData and not in dev mode')
            return res.status(401).json({
                success: false,
                message: 'Authorization required',
            })
        }

        const { user: userData } = validateTelegramInitData(initData, config.botToken)

        const user = await prisma.user.upsert({
            where: { telegramId: BigInt(userData.id) },
            update: {
                username: userData.username,
                firstName: userData.first_name,
                lastName: userData.last_name,
                language: userData.language_code,
            },
            create: {
                telegramId: BigInt(userData.id),
                username: userData.username,
                firstName: userData.first_name,
                lastName: userData.last_name,
                language: userData.language_code,
            },
        })

        req.user = {
            id: user.id,
            telegramId: user.telegramId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
        }

        logger.info(`✅ Auth successful: User ${user.id} (${user.firstName})`)
        next()
    } catch (error: any) {
        logger.error('Auth error:', {
            message: error?.message || 'Unknown error',
            stack: error?.stack?.split('\n').slice(0, 3).join('\n')
        })
        res.status(401).json({
            success: false,
            message: 'Authorization failed',
        })
    }
}

export function optionalAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const initData = req.headers['x-telegram-init-data'] as string

    if (!initData) {
        return next()
    }

    return authMiddleware(req, res, next)
}