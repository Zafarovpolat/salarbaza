import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { config } from '../config'
import { prisma } from '../config/database'
import { logger } from '../utils/logger'

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

        if (!initData) {
            if (config.nodeEnv === 'development') {
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

            return res.status(401).json({
                success: false,
                message: 'Authorization required',
            })
        }

        const params = new URLSearchParams(initData)
        const hash = params.get('hash')
        params.delete('hash')

        const dataCheckString = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n')

        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(config.botToken)
            .digest()

        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex')

        if (calculatedHash !== hash) {
            logger.warn('Invalid Telegram hash')
            return res.status(401).json({
                success: false,
                message: 'Invalid authorization',
            })
        }

        const userDataStr = params.get('user')
        if (!userDataStr) {
            return res.status(401).json({
                success: false,
                message: 'User data not found',
            })
        }

        const userData = JSON.parse(userDataStr)

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

        next()
    } catch (error) {
        logger.error('Auth error:', error)
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