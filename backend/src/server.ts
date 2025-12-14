import app from './app'
import { config } from './config'
import { logger } from './utils/logger'

const PORT = config.port || 3001

async function bootstrap() {
    try {
        // Инициализируем Telegram бота только если есть токен
        if (config.botToken) {
            // Динамический импорт с правильным путём
            const { initTelegramBot } = await import('../bot/index')
            initTelegramBot()
            logger.info('🤖 Telegram bot initialized')
        } else {
            logger.warn('⚠️ BOT_TOKEN not set, bot disabled')
        }

        app.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`)
            logger.info(`📝 Environment: ${config.nodeEnv}`)
            logger.info(`🔗 Health check: http://localhost:${PORT}/health`)
        })
    } catch (error) {
        logger.error('Failed to start server:', error)
        process.exit(1)
    }
}

bootstrap()