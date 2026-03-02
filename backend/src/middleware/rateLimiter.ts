import rateLimit from 'express-rate-limit'

// ✅ Основной лимит — 1000 запросов за 15 минут
export const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Health check не лимитируем
        return req.path === '/health'
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later.'
        })
    }
})

// Строгий лимит только для авторизации/заказов
export const strictRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later.'
        })
    }
})