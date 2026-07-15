import express from 'express'
import compression from 'compression'
import cors from 'cors'
import helmet from 'helmet'
import * as Sentry from '@sentry/node'
import { config } from './config'
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'
import routes from './routes'
import wholesaleRoutes from './routes/wholesaleRoutes'
import { logger } from './utils/logger'

const app = express()

// Render terminates TLS and forwards the original client IP.
// Required for secure cookies and per-IP rate limiting behind the proxy.
app.set('trust proxy', 1)

// CORS
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
        'Idempotency-Key'
    ]
}))

// Helmet
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'unsafe-none' }
}))

// Gzip compression — all JSON responses
app.use(compression())

// Body parsing
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'dekorhouse-api'
    })
})

// Rate limiting
app.use(rateLimiter)

// EARLY logging - log EVERYTHING to debug
app.use((req, res, next) => {
    const logData = {
        method: req.method,
        path: req.path,
        query: req.query,
        headers: {
            'content-type': req.headers['content-type'],
            'x-telegram-init-data': req.headers['x-telegram-init-data'] ? `present (${req.headers['x-telegram-init-data']?.toString().length} chars)` : 'missing',
            'origin': req.headers['origin']
        }
    }

    if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
        logger.warn(`🔥 ${req.method} ${req.path}`, logData)
    } else if (req.path !== '/health') {
        logger.info(`${req.method} ${req.path}`)
    }
    next()
})

// API routes
app.use('/api', routes)
app.use('/api/wholesale', wholesaleRoutes)

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    })
})

// Sentry error handler - must be before custom error handler
Sentry.setupExpressErrorHandler(app)

// Error handler
app.use(errorHandler)

export default app
