import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { config } from '../config'
import { prisma } from '../config/database'
import { AppError } from './errorHandler'

export interface AuthRequest extends Request {
    user?: {
        id: string
        telegramId: bigint
        username?: string
        firstName?: string
        lastName?: string
    }
}

export async function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const initData = req.headers['x-telegram-init-data'] as string

        // Development mode - create test user
        if (config.nodeEnv === 'development' && !initData) {
            let user = await prisma.user.findUnique({
                where: { telegramId: BigInt(123456789) },
            })

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        telegramId: BigInt(123456789),
                        username: 'testuser',
                        firstName: 'Test',
                        lastName: 'User',
                        language: 'uz',
                    },
                })
                await prisma.cart.create({ data: { userId: user.id } })
            }

            req.user = {
                id: user.id,
                telegramId: user.telegramId,
                username: user.username || undefined,
                firstName: user.firstName || undefined,
                lastName: user.lastName || undefined,
            }
            return next()
        }

        if (!initData) {
            throw new AppError('Authorization required', 401)
        }

        // Parse and validate Telegram init data
        const params = new URLSearchParams(initData)
        const userParam = params.get('user')

        if (!userParam) {
            throw new AppError('Invalid authorization', 401)
        }

        const userData = JSON.parse(userParam)

        let user = await prisma.user.findUnique({
            where: { telegramId: BigInt(userData.id) },
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    telegramId: BigInt(userData.id),
                    username: userData.username,
                    firstName: userData.first_name,
                    lastName: userData.last_name,
                    language: userData.language_code === 'ru' ? 'ru' : 'uz',
                },
            })
            await prisma.cart.create({ data: { userId: user.id } })
        }

        req.user = {
            id: user.id,
            telegramId: user.telegramId,
            username: user.username || undefined,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
        }

        next()
    } catch (error) {
        next(error)
    }
}