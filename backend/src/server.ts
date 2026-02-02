import app from './app'
import { config } from './config'
import { logger } from './utils/logger'

const PORT = config.port || 3001

let stopBot: (() => void) | null = null

async function bootstrap() {
    try {
        // Инициализируем Telegram бота только если есть токен
        if (config.botToken) {
            const botModule = await import('../bot/index')
            botModule.initTelegramBot()
            stopBot = botModule.stopBot
            logger.info('🤖 Telegram bot initialized')
        } else {
            logger.warn('⚠️ BOT_TOKEN not set, bot disabled')
        }

        const server = app.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`)
            logger.info(`📝 Environment: ${config.nodeEnv}`)
            logger.info(`🔗 Health check: http://localhost:${PORT}/health`)
        })

        // Graceful shutdown
        const shutdown = (signal: string) => {
            logger.info(`${signal} received, shutting down...`)

            // Останавливаем бота
            if (stopBot) {
                stopBot()
            }

            // Закрываем сервер
            server.close(() => {
                logger.info('Server closed')
                process.exit(0)
            })

            // Форсированное завершение через 10 сек
            setTimeout(() => {
                logger.error('Forced shutdown')
                process.exit(1)
            }, 10000)
        }

        process.on('SIGTERM', () => shutdown('SIGTERM'))
        process.on('SIGINT', () => shutdown('SIGINT'))

        // Global error handlers to prevent crashes
        process.on('uncaughtException', (error: Error) => {
            logger.error('Uncaught Exception:', {
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 5).join('\n') // Only first 5 lines of stack
            })
            // Don't exit - log and continue
        })

        process.on('unhandledRejection', (reason: any) => {
            logger.error('Unhandled Promise Rejection:', {
                message: reason?.message || String(reason),
                code: reason?.code
            })
            // Don't exit - log and continue
        })

    } catch (error: any) {
        logger.error('Failed to start server:', {
            message: error?.message || 'Unknown error',
            stack: error?.stack?.split('\n').slice(0, 5).join('\n')
        })
        process.exit(1)
    }
}

bootstrap()