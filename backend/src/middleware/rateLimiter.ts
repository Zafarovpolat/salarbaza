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

// Строгий лимит для заказов и других чувствительных операций
export const strictRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later.'
        })
    }
})

// Отдельный лимит входа в админку: не более 5 попыток за 15 минут с одного IP.
export const adminLoginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            message: 'Слишком много попыток входа. Попробуйте позже.'
        })
    }
})