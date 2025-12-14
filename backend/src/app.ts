import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config'
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'
import routes from './routes'
import { logger } from './utils/logger'

const app = express()

// Security
app.use(helmet())

// CORS - разрешаем запросы с фронтенда
app.use(cors({
    origin: [
        config.frontendUrl,
        'https://dekorhouse-web.onrender.com',
        'http://localhost:3000',
        'http://localhost:5173'
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data']
}))

// Rate limiting
app.use(rateLimiter)

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`)
    next()
})

// ✅ Health check - ВАЖНО: на корне, не на /api
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'dekorhouse-api',
        version: '1.0.0'
    })
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