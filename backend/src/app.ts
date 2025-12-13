import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config'
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'
import routes from './routes'
import { logger } from './utils/logger'

const app = express()

app.use(helmet())
app.use(cors({ origin: config.frontendUrl, credentials: true }))
app.use(rateLimiter)
app.use(express.json())

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`)
    next()
})

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api', routes)

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' })
})

app.use(errorHandler)

export default app