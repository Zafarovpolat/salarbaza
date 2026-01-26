import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config'
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'
import routes from './routes'
import { logger } from './utils/logger'

const app = express()

// ✅ CORS - ПЕРВЫМ!
app.use(cors({
    origin: [
        'https://dekorhouse-web.onrender.com',
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Telegram-Init-Data',
        'X-Admin-Password'
    ]
}))

// Helmet после CORS
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'unsafe-none' }
}))

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ✅ Health check - ДО rate limiter!
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'dekorhouse-api'
    })
})

// Rate limiting - ПОСЛЕ health check
app.use(rateLimiter)

// Request logging (не логировать health check)
app.use((req, res, next) => {
    if (req.path !== '/health') {
        logger.info(`${req.method} ${req.path}`)
    }
    next()
})

// API routes
app.use('/api', routes)

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    })
})

// Error handler
app.use(errorHandler)

export default app