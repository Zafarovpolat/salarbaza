// backend/src/server.ts
import app from './app'
import { config } from './config'
import { logger } from './utils/logger'
import { initTelegramBot } from '../bot'

const PORT = config.port

async function bootstrap() {
    try {
        // Инициализируем Telegram бота
        if (config.botToken) {
            initTelegramBot()
            logger.info('🤖 Telegram bot initialized')
        } else {
            logger.warn('⚠️ BOT_TOKEN not set, bot disabled')
        }

        app.listen(PORT, () => {
            logger.info(`🚀 Server running on http://localhost:${PORT}`)
            logger.info(`📝 Environment: ${config.nodeEnv}`)
        })
    } catch (error) {
        logger.error('Failed to start server:', error)
        process.exit(1)
    }
}

bootstrap()