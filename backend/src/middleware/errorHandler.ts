import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export class AppError extends Error {
    statusCode: number
    constructor(message: string, statusCode: number = 500) {
        super(message)
        this.statusCode = statusCode
    }
}

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    logger.error(err)

    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.errors,
        })
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'Resource already exists' })
        }
        if (err.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Resource not found' })
        }
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ success: false, message: err.message })
    }

    return res.status(500).json({ success: false, message: 'Internal server error' })
}